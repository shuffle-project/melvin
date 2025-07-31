import { type AudioBuffer, stt } from "@livekit/agents";

export class MelvinSTT extends stt.STT {
  label: string;

  constructor() {
    super({ streaming: true, interimResults: true });
  }

  protected _recognize(frame: AudioBuffer): Promise<stt.SpeechEvent> {
    console.log("Recognizing frame:", frame);
    throw new Error("Method not implemented.");
  }

  stream(): stt.SpeechStream {
    console.log("Creating speech stream");

    const sttStream = new MelvinSTTSpeechStream(this);

    return sttStream;
    // throw new Error("Method not implemented.");
  }
}

export class MelvinSTTSpeechStream extends stt.SpeechStream {
  label: string = "melvin.SpeechStream";

  constructor(stt: stt.STT) {
    super(stt);
    this.run();
  }

  async run() {
    for await (const data of this.input) {
      //   console.log(data);
      // send data to melvin backend
      const speechEvent: stt.SpeechEvent = {
        type: stt.SpeechEventType.INTERIM_TRANSCRIPT,
        alternatives: [
          {
            language: "de",
            text: "hallo welt",
            startTime: 0,
            endTime: 5,
            confidence: 1,
          },
        ],
      };
      this.queue.put(speechEvent);
    }
  }
}
