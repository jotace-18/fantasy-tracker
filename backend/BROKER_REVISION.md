# 📊 REVISIÓN COMPLETA: BROKER DE MERCADO v2.1

## 🎯 OBJETIVO DEL SISTEMA
Recomendar jugadores que:
1. **Generen ganancias** por revalorización (objetivo principal)
2. **Sean útiles para el XI** (titular + rendimiento)
3. **Sean asequibles** según el presupuesto del usuario

---

## ✅ VERIFICACIÓN DE ESCALAS Y PESOS

### 1. SCORE PRINCIPAL (Modo Market)

```javascript
score = (trendScore * 0.50) +                    // 50% - TENDENCIA (transformada)
        (undervalue_factor * 0.18) +             // 18% - Infravaloración
        (momentum * 0.10) +                      // 10% - Forma reciente
        (titular_next_jor * 0.10) +              // 10% - Probabilidad titular
        ((5 - risk_level) / 5 * 0.06) +          // 6%  - Riesgo bajo
        ((1 - volatility) * 0.06) +              // 6%  - Estabilidad
        (lesionado * -1.0) +                     // -100% si lesionado
        financialRisk +                          // Variable (-0.5 a 0)
        catalyst.bonus +                         // 0 a +0.20
        bubble.penalty +                         // -0.25 a 0
        timing.score                             // -0.12 a +0.15
```

**Pesos base:** 100% distribuido
**Modificadores:**
- Contexto (×0.6 a ×2.0): Se multiplica al score final
- Disponibilidad: +0.20 (mercado), +0.10 (clausulable), -0.12 (banco), -0.80 (no disponible)

#### ✅ VALIDACIÓN:
- **Tendencia como rey (50%)**: ✅ CORRECTO - Es el factor más importante para revalorización
- **Balance puntos-XI (20%)**: momentum + titular = 20% ✅ CORRECTO
- **Seguridad (12%)**: riesgo + volatilidad = 12% ✅ CORRECTO
- **Infravaloración (18%)**: ✅ CORRECTO - Ganga relativa

---

### 2. TRANSFORMACIÓN DE TENDENCIA (trendScore)

#### Tendencias Positivas (Exponencial):
```
trend_future = +0.80 → trendScore ≈ 0.85 (+25% bonus) → PESO FINAL: 42.5%
trend_future = +0.50 → trendScore ≈ 0.60 (+15% bonus) → PESO FINAL: 30.0%
trend_future = +0.20 → trendScore ≈ 0.30 (+8% bonus)  → PESO FINAL: 15.0%
trend_future = +0.10 → trendScore ≈ 0.20               → PESO FINAL: 10.0%
```

#### Tendencias Negativas (Cuadrática):
```
trend_future = -0.20 → trendScore ≈ -0.35 → PESO FINAL: -17.5%
trend_future = -0.50 → trendScore ≈ -0.70 → PESO FINAL: -35.0%
```

#### ⚠️ PROBLEMA DETECTADO:
La transformación puede generar scores negativos muy fuertes que anulen todo lo demás.

**Ejemplo crítico:**
- Jugador: trend = -0.5, undervalue = 0.9, momentum = 0.8, titular = 1.0
- trendScore = -0.70
- Score parcial = (-0.70 × 0.50) + (0.9 × 0.18) + (0.8 × 0.10) + (1.0 × 0.10) = **-0.17**
- Incluso siendo ganga + titular + forma, el score es negativo

**RECOMENDACIÓN:** Ajustar la curva de penalización o limitar el impacto negativo al 30% en lugar de 50%.

---

### 3. CONTEXTO TÁCTICO (context_factor)

```javascript
contextFactor = formFactor × matchupFactor × homeBonus
```

#### Rangos:
- **formFactor**: 0.70 (muy mala) a 1.30 (excelente) - basado en avg_points del equipo
- **matchupFactor**: 
  - 1.35: Rival 10+ posiciones inferior
  - 1.20: Rival 6-9 pos inferior
  - 1.10: Rival 3-5 pos inferior
  - 1.00: Rival similar (±2 posiciones)
  - 0.90: Rival 3-5 pos superior
  - 0.75: Rival 6-9 pos superior
  - 0.65: Rival 10+ pos superior
- **homeBonus**: 1.12 (casa) / 0.88 (fuera)

#### Ejemplos:
```
Caso 1 - Mejor escenario:
- form=1.30, matchup=1.35 (colista), home=1.12
- contextFactor = 1.30 × 1.35 × 1.12 = 1.96
- Score × 1.96 = ¡Score casi se duplica!

Caso 2 - Peor escenario:
- form=0.70, matchup=0.65 (líder), home=0.88
- contextFactor = 0.70 × 0.65 × 0.88 = 0.40
- Score × 0.40 = ¡Score se reduce a menos de la mitad!
```

#### ✅ VALIDACIÓN:
- Rango multiplicativo (0.4 - 2.0): ✅ MUY BUENO - Alta sensibilidad
- Localía diferenciada: ✅ CORRECTO - 12% vs -12%
- Rivalidad por posiciones: ✅ CORRECTO - Diferencia clara entre partidos

---

### 4. INFRAVALORACIÓN (undervalue_factor)

```javascript
rawRatio = avgPoints / (avgMarketValue / 1_000_000)  // Puntos por millón €
calibrated = log10(rawRatio + 1) / log10(6)
```

#### Ejemplos:
```
Jugador A: 6 puntos/jornada, valor 3M€ → ratio=2.0 → undervalue=0.48 (DÉBIL)
Jugador B: 6 puntos/jornada, valor 1M€ → ratio=6.0 → undervalue=0.85 (GANGA)
Jugador C: 10 puntos/jornada, valor 2M€ → ratio=5.0 → undervalue=0.78 (BUENA)
```

#### ✅ VALIDACIÓN:
- Escala logarítmica: ✅ CORRECTO - Comprime valores extremos
- Peso 18%: ✅ CORRECTO - Importante pero no decisivo
- Rango 0-1: ✅ CORRECTO

---

### 5. CATALIZADORES

```javascript
easy_fixtures:   +0.15 (next_3_difficulty < 0.4)
breakout:        +0.20 (market_delta_7d > 8% AND momentum > 0.65)
new_starter:     +0.12 (titular=100% AND perf>0.6 AND delta_7d<5%)
```

#### ⚠️ PROBLEMA:
`next_3_difficulty` NO se está calculando en `getTeamContext`. Solo devuelve el siguiente partido.

**SOLUCIÓN REQUERIDA:**
Calcular promedio de dificultad de los próximos 3 partidos en `getTeamContext`.

---

### 6. BURBUJAS (Detección de sobrevaloración)

```javascript
Burbuja ALTA:    -0.25 (overvalued + rising_fast + bajo_rendimiento)
Burbuja MEDIA:   -0.15 (overvalued + momentum_extremo + volatilidad)
Burbuja BAJA:    -0.08 (undervalue<0.20 + trend>0.05)
```

#### ✅ VALIDACIÓN:
- Penalizaciones proporcionales: ✅ CORRECTO
- Lógica conservadora: ✅ CORRECTO - Evita gangas falsas

---

### 7. TIMING (Momento de compra)

```javascript
early_mover:     +0.15 (trend>0.03 BUT delta_7d<8% AND momentum>0.55)
train_chaser:    -0.12 (delta_3d>8% OR delta_7d>15%)
momentum_play:   +0.08 (delta_7d entre 5-12% AND momentum>0.65)
```

#### ✅ VALIDACIÓN:
- Recompensa compras anticipadas: ✅ CORRECTO
- Penaliza perseguir subidas: ✅ CORRECTO
- Rangos razonables: ✅ CORRECTO

---

### 8. RIESGO FINANCIERO

```javascript
qualityIndex = (momentum × 0.4) + (normalizedPoints × 0.4) + (titular × 0.2)
percentageOfBudget = price_to_pay / money

Si > 150% presupuesto: -0.50
Si > 100% presupuesto: -0.35
Sino: rawPenalty × (1 - qualityIndex)

rawPenalty = -(percentageOfBudget^3.5) × 0.30
```

#### ✅ VALIDACIÓN:
- Penalización exponencial: ✅ CORRECTO - Desaconseja fuertemente gastar más de lo que tienes
- Ajuste por calidad: ✅ CORRECTO - Permite excepciones para élite
- Umbral 100%: ✅ CORRECTO

---

### 9. PUJA SUGERIDA (NUEVO - v2.1)

```javascript
Score 0.9+:   +40-60% sobre mercado
Score 0.75-0.9: +25-40%
Score 0.6-0.75: +15-25%
Score 0.4-0.6:  +8-15%
Score 0.0-0.4:  +3-8%
```

#### ✅ VALIDACIÓN:
- Progresión razonable: ✅ CORRECTO
- Score 0.94 (Alexis) → +52% ≈ €1.52M si mercado = €1M: ✅ MUY BUENO
- Score 0.70 → +22% ≈ €1.22M: ✅ CORRECTO

---

## 🐛 PROBLEMAS ENCONTRADOS

### 1. ❌ CRÍTICO: Penalización de tendencia demasiado fuerte
**Impacto:** Jugadores con mala tendencia pero buenos fundamentos se descartan injustamente.
**Solución:** Limitar el peso de tendencias negativas al 30% en lugar de 50%.

### 2. ❌ BLOQUEANTE: `next_3_difficulty` no se calcula
**Impacto:** Catalizador "easy_fixtures" nunca se activa.
**Solución:** Modificar `getTeamContext` para calcular los próximos 3 partidos.

### 3. ⚠️ MENOR: Búsqueda de jornada puede fallar si no hay fecha_cierre
**Impacto:** Contexto incorrecto para jornadas sin fecha.
**Solución:** Buscar la jornada más baja sin completar en lugar de por fecha.

---

## 💡 RECOMENDACIONES DE MEJORA

### Inmediatas (Críticas):
1. **Limitar impacto negativo de tendencia:** Cambiar peso de 50% a 35% para negativos
2. **Implementar `next_3_difficulty`** en getTeamContext
3. **Añadir tooltips explicativos** en frontend sobre por qué un score es alto/bajo

### Corto plazo (Mejora UX):
4. **Mostrar breakdown del score** (hover muestra: trend 50%, undervalue 18%, etc.)
5. **Badge visual de catalizadores** (🔥 Breakout, 📅 Easy fixtures, etc.)
6. **Advertencia de burbujas** (⚠️ Posible sobrevaloración)

### Medio plazo (Optimización):
7. **Machine Learning para trend_future:** Usar histórico real en lugar de regresión lineal
8. **Análisis de rivals directos:** Comparar con jugadores de posición similar
9. **Seasonality:** Ajustar por jornada (inicio vs final de liga)

---

## ✅ CONCLUSIÓN GENERAL

### Fortalezas del Sistema:
1. ✅ Tendencia como factor principal (50%) - CORRECTO para objetivo de revalorización
2. ✅ Balance entre XI y ganancia financiera
3. ✅ Contexto táctico muy sensible y realista
4. ✅ Sistema anti-burbujas efectivo
5. ✅ Puja dinámica basada en score - EXCELENTE

### Debilidades Críticas:
1. ❌ Tendencias negativas penalizan demasiado (pueden anular todo)
2. ❌ Catalizador "easy_fixtures" no funciona (missing data)
3. ⚠️ Falta transparencia en frontend (usuario no sabe POR QUÉ un score es X)

### Efectividad Esperada:
- **Score 0.8+**: Gangas reales, alta probabilidad de revalorización ✅
- **Score 0.6-0.8**: Buenas oportunidades, riesgo moderado ✅
- **Score 0.4-0.6**: Opciones neutrales, no destacan ⚠️
- **Score <0.4**: Evitar salvo necesidad específica ❌

---

## 📝 ACCIÓN INMEDIATA REQUERIDA

```javascript
// 1. Ajustar peso de tendencias negativas
const trendWeight = trend_future >= 0 ? 0.50 : 0.35; // Reducir impacto de negativos
score = (trendScore * trendWeight) + ...

// 2. Implementar next_3_difficulty en getTeamContext
// Ver próximos 3 enfrentamientos y promediar dificultad

// 3. Añadir tooltips explicativos en RecommendationsPage.jsx
```

---

**Fecha de revisión:** 13 de octubre de 2025
**Versión revisada:** Broker de Mercado v2.1
**Estado:** Sistema funcional con mejoras críticas identificadas
