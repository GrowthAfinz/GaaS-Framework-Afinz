import { ExperimentStats } from '../../types/experiments';

export interface TestMetricsInput {
  n_controle: number;
  conv_controle: number;
  n_variante: number;
  conv_variante: number;
}

export interface StatsCalculator {
  calculate(input: TestMetricsInput, confidenceLevel?: number): Omit<ExperimentStats, 'n_controle' | 'conv_controle' | 'conv_rate_controle' | 'n_variante' | 'conv_variante' | 'conv_rate_variante'>;
}

// Error function approximation (Abramowitz and Stegun 7.1.26)
function erf(x: number): number {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
}

// Cumulative standard normal distribution function (Phi)
function stdNormalCDF(z: number): number {
  return 0.5 * (1.0 + erf(z / Math.sqrt(2.0)));
}

// Z-Score to two-tailed P-Value
export function zToPValue(z: number): number {
  return 2.0 * (1.0 - stdNormalCDF(Math.abs(z)));
}

export class FrequentistZTestCalculator implements StatsCalculator {
  /**
   * Calculates required sample size per group.
   * Uses standard 80% power and 95% confidence level with a 20% relative MDE.
   */
  private calculateRequiredSampleSize(baselineRate: number, relativeMde: number = 0.20): number {
    if (baselineRate <= 0 || baselineRate >= 1) return 1000;
    
    const absoluteMde = baselineRate * relativeMde;
    const p = baselineRate;
    
    // Z_(alpha/2) for 95% = 1.96, Z_beta for 80% = 0.84
    const zAlpha = 1.96;
    const zBeta = 0.84;
    
    const n = (2.0 * Math.pow(zAlpha + zBeta, 2.0) * p * (1.0 - p)) / Math.pow(absoluteMde, 2.0);
    return Math.max(100, Math.ceil(n));
  }

  /**
   * Performs Chi-Square goodness-of-fit test for SRM detection (expected 50/50 ratio).
   * Since df = 1, we can compute Chi-Square and map its p-value using standard normal Z = sqrt(chi2).
   */
  private detectSRM(nVariante: number, nControle: number): { pValue: number; srmDetectado: boolean } {
    const total = nVariante + nControle;
    if (total < 50) return { pValue: 1.0, srmDetectado: false };
    
    const expected = total / 2.0;
    const chi2 = (Math.pow(nControle - expected, 2.0) / expected) + (Math.pow(nVariante - expected, 2.0) / expected);
    
    // For df = 1, Chi-Square p-value equals two-tailed p-value of normal Z = sqrt(chi2)
    const zSrm = Math.sqrt(chi2);
    const pValue = zToPValue(zSrm);
    
    // Industry standard threshold for SRM is p < 0.001 (0.1%) to minimize false alerts
    const srmDetectado = pValue < 0.001;
    
    return { pValue, srmDetectado };
  }

  public calculate(input: TestMetricsInput, confidenceLevel: number = 0.95): Omit<ExperimentStats, 'n_controle' | 'conv_controle' | 'conv_rate_controle' | 'n_variante' | 'conv_variante' | 'conv_rate_variante'> {
    const { n_controle, conv_controle, n_variante, conv_variante } = input;
    
    // Default fallback values if sample is zero
    if (n_controle <= 0 || n_variante <= 0) {
      return {
        delta_abs: 0,
        delta_rel: 0,
        z_score: 0,
        p_value: 1.0,
        significativo: false,
        ci_low: 0,
        ci_high: 0,
        srm_p_value: 1.0,
        srm_detectado: false,
        n_min_per_group: 1000,
        sample_progress: 0
      };
    }

    const pControl = conv_controle / n_controle;
    const pVariant = conv_variante / n_variante;
    
    const deltaAbs = pVariant - pControl;
    const deltaRel = pControl > 0 ? deltaAbs / pControl : 0;
    
    // Z-score calculation
    const pooledP = (conv_controle + conv_variante) / (n_controle + n_variante);
    const standardError = Math.sqrt(pooledP * (1.0 - pooledP) * ((1.0 / n_controle) + (1.0 / n_variante)));
    
    const zScore = standardError > 0 ? deltaAbs / standardError : 0;
    const pValue = zScore !== 0 ? zToPValue(zScore) : 1.0;
    
    const significativo = pValue < (1.0 - confidenceLevel);
    
    // CI calculation for the relative lift: standard error of relative lift
    // RelLift CI bounds: lift +/- Z_critical * (StandardError / ControlRate)
    const zCritical = 1.96; // For 95% CI
    const ciError = pControl > 0 && standardError > 0 ? (zCritical * standardError) / pControl : 0;
    
    const ciLow = deltaRel - ciError;
    const ciHigh = deltaRel + ciError;
    
    // SRM Check
    const srm = this.detectSRM(n_variante, n_controle);
    
    // Sample size progress
    const nMinPerGroup = this.calculateRequiredSampleSize(pControl, 0.20);
    const minSampleObtained = Math.min(n_controle, n_variante);
    const sampleProgress = Math.min(1.0, minSampleObtained / nMinPerGroup);

    return {
      delta_abs: deltaAbs,
      delta_rel: deltaRel,
      z_score: zScore,
      p_value: pValue,
      significativo,
      ci_low: ciLow,
      ci_high: ciHigh,
      srm_p_value: srm.pValue,
      srm_detectado: srm.srmDetectado,
      n_min_per_group: nMinPerGroup,
      sample_progress: sampleProgress
    };
  }
}

export const statsEngine = new FrequentistZTestCalculator();
