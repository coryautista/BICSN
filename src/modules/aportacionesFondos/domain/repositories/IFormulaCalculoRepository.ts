import { FormulaCalculo } from '../entities/FormulaCalculo.js';

export interface IFormulaCalculoRepository {
  obtenerPorPeriodo(anio: number, quincena: number, claveFormula?: string): Promise<FormulaCalculo>;
}
