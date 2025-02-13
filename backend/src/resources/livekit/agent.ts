import { defineAgent } from '@livekit/agents';

export default defineAgent({
  entry: async (ctx) => {
    console.log('entrypoint agent');

    // connect to the room
    await ctx.connect();
    // handle the session
  },
});
