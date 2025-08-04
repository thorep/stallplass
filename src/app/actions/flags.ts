'use server'

import { minhestFlag } from "../../../flags";

export async function getMinhestFlag() {
  return await minhestFlag();
}