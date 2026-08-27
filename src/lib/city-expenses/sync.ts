import { ingestMunicipalExpenseDeliveryToDb } from "@/lib/fiscal";
import { fetchBeloHorizonteExpenses } from "./belo-horizonte";
import { fetchRecifeExpenses } from "./recife";

const fetchers = {
  "belo-horizonte": fetchBeloHorizonteExpenses,
  recife: fetchRecifeExpenses,
};

export type CityExpenseSync = keyof typeof fetchers;

export function isCityExpenseSync(value: string): value is CityExpenseSync {
  return value in fetchers;
}

export async function syncCityExpenses(city: CityExpenseSync, year = new Date().getUTCFullYear()) {
  return ingestMunicipalExpenseDeliveryToDb(await fetchers[city](year));
}
