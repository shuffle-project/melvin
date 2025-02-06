import { defineAgent, JobContext } from '@livekit/agents';

export default defineAgent({
  entry: async (ctx: JobContext) => {
    // connect to the room
    await ctx.connect();
    // handle the session
  },
});
