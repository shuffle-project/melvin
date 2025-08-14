// SPDX-FileCopyrightText: 2024 LiveKit, Inc.
//
// SPDX-License-Identifier: Apache-2.0
import {
  type JobContext,
  WorkerOptions,
  cli,
  defineAgent,
} from "@livekit/agents";
import type { Track } from "@livekit/rtc-node";
import { AudioStream, RoomEvent, TrackKind } from "@livekit/rtc-node";
import { fileURLToPath } from "node:url";
import { MelvinSTT } from "./melvin-stt";

export default defineAgent({
  entry: async (ctx: JobContext) => {
    await ctx.connect();
    console.log("starting STT example agent");

    const transcribeTrack = async (track: Track) => {
      const audioStream = new AudioStream(track);
      const sttStream = new MelvinSTT().stream();

      const sendTask = async () => {
        for await (const event of audioStream) {
          sttStream.pushFrame(event);
        }
      };

      const recvTask = async () => {
        for await (const event of sttStream) {
          console.log("Received STT event:");
          console.log(event);
          const message = "Hello, this is your agent bot!";
          const payload = Buffer.from(message, "utf-8");

          ctx.room.localParticipant?.sendChatMessage(
            event.alternatives![0].text
          );
          // Send a reliable message to all participants
          // ctx.room.localParticipant!.publishData(payload, {
          //   reliable: true,
          // });
          // ctx.room.emit(RoomEvent.ChatMessage, {
          //   id: "stt",
          //   message: event.alternatives![0].text,
          //   timestamp: Date.now(),
          // });

          //   if (event.type === stt.SpeechEventType.FINAL_TRANSCRIPT) {
          //     console.log(event.alternatives![0].text);
          //   }
        }
      };

      Promise.all([sendTask(), recvTask()]);
    };

    ctx.room.on(RoomEvent.TrackSubscribed, async (track: Track) => {
      console.log(`Track subscribed: ${track.sid}, kind: ${track.kind}`);
      if (track.kind === TrackKind.KIND_AUDIO) {
        transcribeTrack(track);
      }
    });
  },
});

cli.runApp(
  new WorkerOptions({
    agent: fileURLToPath(import.meta.url),
    logLevel: "trace",
    wsURL: process.env.LIVEKIT_URL,
    apiKey: process.env.LIVEKIT_API_KEY,
    apiSecret: process.env.LIVEKIT_API_SECRET,
  })
);
