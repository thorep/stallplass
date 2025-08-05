'use server'

import { minhestFlag, rabattkodeFlag } from "../../../flags";

export async function getMinhestFlag() {
  return await minhestFlag();
}

export async function getRabattkodeFlag() {
  return await rabattkodeFlag();
}