import { Identify } from "flags";
import { dedupe, flag } from "flags/next";
import { createHypertuneAdapter } from "@flags-sdk/hypertune";
import { createClient } from './src/utils/supabase/server';
import {
  createSource,
  flagFallbacks,
  vercelFlagDefinitions as flagDefinitions,
  Context,
  RootFlagValues,
} from "./generated/hypertune";

const identify: Identify<Context> = dedupe(
  async ({ headers, cookies }) => {
    try {
      // Get user from Supabase auth using server client
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get profile data if user exists
      let profile = null;
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('firstname, lastname, nickname')
          .eq('id', user.id)
          .single();
        profile = data;
      }
      
      return {
        environment: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
        user: user ? {
          id: user.id,
          name: profile?.nickname || `${profile?.firstname} ${profile?.lastname}`.trim() || user.email?.split('@')[0] || '',
          email: user.email || '',
        } : {
          id: '',
          name: '',
          email: '',
        },
      };
    } catch (error) {
      console.error('Error identifying user:', error);
      // Return default context on error
      return {
        environment: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
        user: {
          id: '',
          name: '',
          email: '',
        },
      };
    }
  },
);

const hypertuneAdapter = createHypertuneAdapter<
  RootFlagValues,
  Context
>({
  createSource,
  flagFallbacks,
  flagDefinitions,
  identify,
});

export const minhestFlag = flag(
  hypertuneAdapter.declarations.minhest,
);

export const rabattkodeFlag = flag(
  hypertuneAdapter.declarations.rabattkode,
);

export const showCompressionInfoFrontendFlag = flag(
  hypertuneAdapter.declarations.showCompressionInfoFrontend,
);

export const aiWaitTimeFlag = flag(
  hypertuneAdapter.declarations.aiwaittime,
);

