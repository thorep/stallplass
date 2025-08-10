'use server'

import { aiWaitTimeFlag } from "../../../flags";

export async function getAiWaitTimeFlag() {
  return await aiWaitTimeFlag();
}


