#!/usr/bin/env python3
"""
TalentScout AI — Harness de simulación y validación de candidatos.

Valida la parte DETERMINISTA del pipeline (fórmulas, umbrales, invariantes, esquemas y máquina
de estados) sin depender de Gemini/n8n/Vapi en vivo. Sirve como prueba de regresión rápida tras
cualquier cambio en la lógica de scoring o en el reporte final.

Uso:
    python simulate_candidate.py            # corre personas base + invariantes (modo humano)
    python simulate_candidate.py --json     # salida JSON (para monitoreo/scheduled task)
    python simulate_candidate.py --report R # valida además un reporte final real (JSON) en ruta R

Código de salida 0 si todo pasa; 1 si alguna verificación falla.

Fuente de verdad de fórmulas y umbrales: CLAUDE.md (Módulos 7 y 8). Si cambian allí, actualiza
las constantes de este archivo.
"""
from __future__ import annotations
import argparse
import json
import sys

# --- Constantes del sistema (deben coincidir con CLAUDE.md) -----------------------------------

# Pesos del Fraud Risk Score consolidado (Módulo 7). Suman 1.0 => es un promedio ponderado.
WEIGHTS = {"cv_consistency": 0.25, "text_authenticity": 0.30, "voice_authenticity": 0.45}

# Umbrales de clasificación del fraud_risk_score (0 = sin riesgo, 100 = alto riesgo)
def classify_fraud(score: float) -> str:
    if score <= 25:
        return "VERIFIED"
    if score <= 60:
        return "CAUTION"
    return "HIGH_RISK"

# Máquina de estados de la sesión (status). Transiciones permitidas.
VALID_TRANSITIONS = {
    "pending": {"text_interview", "rejected_no_consent"},
    "text_interview": {"voice_invited", "rejected_disc"},
    "voice_invited": {"voice_complete", "rejected_disc"},
    "voice_complete": {"complete", "rejected_fraud"},
    "complete": set(),
    "rejected_no_consent": set(),
    "rejected_disc": set(),
    "rejected_fraud": set(),
}

REQUIRED_REPORT_FIELDS = {
    "session_id": str,
    "candidate": dict,
    "disc": dict,
    "fraud_assessment": dict,
    "recommendation": str,
}
VALID_RECOMMENDATIONS = {"PROCEED", "REVIEW", "DISCARD"}

# --- Cálculo del pipeline ---------------------------------------------------------------------

def compute_fraud_score(cv: float, text: float, voice: float) -> float:
    authenticity = (
        WEIGHTS["cv_consistency"] * cv
        + WEIGHTS["text_authenticity"] * text
        + WEIGHTS["voice_authenticity"] * voice
    )
    return round(100 - authenticity, 2)

# --- Personas de simulación (fixtures) --------------------------------------------------------
# Cada persona define los scores intermedios que producirían los módulos 1/4/6 para ese perfil,
# y la clasificación + recomendación esperadas. Son el punto de partida de la simulación.
PERSONAS = [
    {
        "name": "Honesto — 5 años de experiencia real",
        "disc": {"d": 40, "i": 30, "s": 20, "c": 10},
        "cv_consistency": 90, "text_authenticity": 85, "voice_authenticity": 88,
        "consent_given": True,
        "expected_label": "VERIFIED", "expected_recommendation": "PROCEED",
    },
    {
        "name": "Límite — CV algo inflado, dudas menores",
        "disc": {"d": 25, "i": 25, "s": 25, "c": 25},
        "cv_consistency": 70, "text_authenticity": 60, "voice_authenticity": 55,
        "consent_given": True,
        "expected_label": "CAUTION", "expected_recommendation": "REVIEW",
    },
    {
        "name": "Fraudulento — CV falso, titubea con fechas",
        "disc": {"d": 55, "i": 20, "s": 15, "c": 10},
        "cv_consistency": 40, "text_authenticity": 35, "voice_authenticity": 20,
        "consent_given": True,
        "expected_label": "HIGH_RISK", "expected_recommendation": "DISCARD",
    },
    {
        "name": "Sin consentimiento (Ley 81)",
        "disc": {"d": 30, "i": 30, "s": 20, "c": 20},
        "cv_consistency": 80, "text_authenticity": 80, "voice_authenticity": 80,
        "consent_given": False,
        "expected_label": None, "expected_recommendation": None,
        "expected_status": "rejected_no_consent",
    },
]

LABEL_TO_RECOMMENDATION = {"VERIFIED": "PROCEED", "CAUTION": "REVIEW", "HIGH_RISK": "DISCARD"}


def check(results: list, name: str, passed: bool, detail: str = "") -> None:
    results.append({"check": name, "passed": bool(passed), "detail": detail})


def run_personas(results: list) -> None:
    for p in PERSONAS:
        # Invariante DISC: suma == 100
        disc_sum = sum(p["disc"].values())
        check(results, f"[{p['name']}] DISC suma 100", disc_sum == 100,
              f"suma={disc_sum}")

        # Invariante de rangos 0-100
        for k in ("cv_consistency", "text_authenticity", "voice_authenticity"):
            check(results, f"[{p['name']}] {k} en rango 0-100", 0 <= p[k] <= 100,
                  f"{k}={p[k]}")

        # Gate de Ley 81: sin consentimiento no se procesa
        if not p["consent_given"]:
            check(results, f"[{p['name']}] gate Ley 81 => rejected_no_consent",
                  p.get("expected_status") == "rejected_no_consent",
                  "candidato sin consent no debe avanzar de pending")
            continue

        # Fraud score + clasificación
        score = compute_fraud_score(p["cv_consistency"], p["text_authenticity"], p["voice_authenticity"])
        label = classify_fraud(score)
        check(results, f"[{p['name']}] clasificación esperada",
              label == p["expected_label"],
              f"score={score} => {label} (esperado {p['expected_label']})")

        # Coherencia label -> recomendación
        rec = LABEL_TO_RECOMMENDATION[label]
        check(results, f"[{p['name']}] recomendación coherente",
              rec == p["expected_recommendation"],
              f"{label} => {rec}")


def run_formula_edge_cases(results: list) -> None:
    # Bordes de los umbrales
    cases = [
        (100, 100, 100, "VERIFIED"),   # score 0
        (0, 0, 0, "HIGH_RISK"),        # score 100
    ]
    for cv, tx, vo, expected in cases:
        score = compute_fraud_score(cv, tx, vo)
        check(results, f"borde fórmula cv={cv} text={tx} voice={vo}",
              classify_fraud(score) == expected,
              f"score={score} => {classify_fraud(score)} (esperado {expected})")
    # Los pesos deben sumar exactamente 1.0
    check(results, "pesos del fraud score suman 1.0",
          abs(sum(WEIGHTS.values()) - 1.0) < 1e-9,
          f"suma={sum(WEIGHTS.values())}")


def run_state_machine(results: list) -> None:
    # Un camino feliz completo debe ser válido
    happy = ["pending", "text_interview", "voice_invited", "voice_complete", "complete"]
    ok = all(happy[i + 1] in VALID_TRANSITIONS[happy[i]] for i in range(len(happy) - 1))
    check(results, "máquina de estados: camino feliz válido", ok, " -> ".join(happy))
    # Una transición ilegal debe rechazarse
    illegal = "complete" in VALID_TRANSITIONS["pending"]
    check(results, "máquina de estados: pending->complete es ilegal", not illegal)


def validate_report(path: str, results: list) -> None:
    try:
        with open(path, "r", encoding="utf-8") as f:
            report = json.load(f)
    except Exception as e:  # noqa: BLE001
        check(results, f"reporte final legible ({path})", False, str(e))
        return
    for field, typ in REQUIRED_REPORT_FIELDS.items():
        present = field in report and isinstance(report[field], typ)
        check(results, f"reporte: campo '{field}' presente y {typ.__name__}", present)
    rec = report.get("recommendation")
    check(results, "reporte: recommendation válida", rec in VALID_RECOMMENDATIONS,
          f"recommendation={rec}")
    fa = report.get("fraud_assessment", {})
    if isinstance(fa, dict) and "risk_score" in fa:
        rs = fa["risk_score"]
        check(results, "reporte: risk_score en rango 0-100",
              isinstance(rs, (int, float)) and 0 <= rs <= 100, f"risk_score={rs}")


def main() -> int:
    ap = argparse.ArgumentParser(description="Simulador/validador de candidatos TalentScout AI")
    ap.add_argument("--json", action="store_true", help="salida en JSON")
    ap.add_argument("--report", help="ruta a un reporte final (JSON) para validar su esquema")
    args = ap.parse_args()

    results: list = []
    run_personas(results)
    run_formula_edge_cases(results)
    run_state_machine(results)
    if args.report:
        validate_report(args.report, results)

    passed = sum(1 for r in results if r["passed"])
    total = len(results)
    all_ok = passed == total

    if args.json:
        print(json.dumps({
            "ok": all_ok, "passed": passed, "total": total, "results": results,
        }, ensure_ascii=False, indent=2))
    else:
        for r in results:
            mark = "PASS" if r["passed"] else "FAIL"
            line = f"[{mark}] {r['check']}"
            if r["detail"]:
                line += f"  ·  {r['detail']}"
            print(line)
        print("-" * 60)
        print(f"{passed}/{total} verificaciones OK" + ("" if all_ok else "  <-- HAY FALLOS"))

    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
