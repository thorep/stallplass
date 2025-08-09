'use server'

import { rabattkodeFlag, aiWaitTimeFlag, kampanjeFlag } from "../../../flags";

export async function getRabattkodeFlag() {
  return await rabattkodeFlag();
}

export async function getAiWaitTimeFlag() {
  return await aiWaitTimeFlag();
}

export async function getKampanjeFlag() {
  return await kampanjeFlag();
}

