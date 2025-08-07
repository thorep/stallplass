'use server'

import { rabattkodeFlag, aiWaitTimeFlag } from "../../../flags";

export async function getRabattkodeFlag() {
  return await rabattkodeFlag();
}

export async function getAiWaitTimeFlag() {
  return await aiWaitTimeFlag();
}

