import { Injectable } from '@nestjs/common';
import { exec, spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import { join } from 'path';
import { Audio, Project, Video } from '../db/schemas/project.schema';
import { CustomLogger } from '../logger/logger.service';
import { PathService } from '../path/path.service';
import { WaveformData } from './ffmpeg.interfaces';

/**
 * Analyzing sample rate 8000 seems to be a good default: https://trac.ffmpeg.org/wiki/Waveform
 */
const WAVEFORM_ANALYZING_SAMPLERATE = 8000;
const WAVEFORM_STORED_SAMPLES_PER_SECOND = 100;
const WAVEFORM_NORMALIZED_MAXIMUM = 100;

@Injectable()
export class FfmpegService {
  private ffmpeg = ffmpegPath;
  private ffprobe = ffprobePath.path;

  constructor(private logger: CustomLogger, private pathService: PathService) {
    this.logger.setContext(this.constructor.name);
  }

  public async getWaveformData(
    project: Project,
    wav: Audio,
  ): Promise<WaveformData> {
    const projectId = project._id.toString();
    // const videoFilepath = this.pathService.getVideoFile(projectId);
    // const audioFilepath = this.pathService.getMp3File(projectId);
    const audioFilepath = this.pathService.getMediaFile(projectId, wav);
    const args = [
      // logging
      '-loglevel',
      'fatal',
      // error = Show all errors, including ones which can be recovered from.
      // fatal = Only show fatal errors which could lead the process to crash, such as an assertion failure.
      // input file
      '-i',
      `${audioFilepath}`,
      // audio codec
      '-codec:a',
      'pcm_s16le',
      // filtering
      '-filter_complex',
      `aformat=channel_layouts=mono, compand, aresample=${WAVEFORM_ANALYZING_SAMPLERATE}`,
      // output format
      '-f',
      'data',
      // pipe output to console
      '-',
    ];

    // Get audio data from ffmpeg
    const rawData = await this.execAsStream(args);

    // Read binary to buffer
    const buffer = Buffer.from(rawData, 'binary');

    // Read bytes regarding audio codec: pcm_s16le -> signed int, 16bit, little endian
    const data: number[] = new Array(buffer.length / 2);
    for (let i = 0; i < buffer.length / 2; i++) {
      data[i] = buffer.readInt16LE(i * 2);
    }

    // Reduce samples to target sample rate
    const { maximum, reducedData } = this._reduceSampleRate(
      data,
      WAVEFORM_ANALYZING_SAMPLERATE,
      WAVEFORM_STORED_SAMPLES_PER_SECOND,
    );

    // Normalize data
    const waveformData = this._normalizeData(
      maximum,
      reducedData,
      WAVEFORM_NORMALIZED_MAXIMUM,
    );

    return waveformData;
  }

  public async processVideoFile(
    filePath: string,
    projectId: string,
    video: Video,
  ): Promise<void> {
    // create dir if does not exist
    // const projDir = this.pathService.getProjectDirectory(projectId);
    // await ensureDir(join(projDir, 'videos'));

    const videoFilepath = this.pathService.getMediaFile(projectId, video);
    // if (videoId === null) {
    //   videoFilepath = this.pathService.getVideoFile(projectId);
    // } else {
    //   // loop through additinal file indexes until the first path who wasnt created yet
    //   videoFilepath = this.pathService.getAdditionalVideoFile(
    //     projectId,
    //     videoId,
    //   );
    // }

    // TODO limit size of file
    const commands = [
      // this.ffmpeg,
      '-loglevel',
      'error',
      // error = Show all errors, including ones which can be recovered from.
      // fatal = Only show fatal errors which could lead the process to crash, such as an assertion failure.
      '-i',
      `${filePath}`,
      // crf on 51 -> max qual loss, on 0 -> zero qual loss, 23 is default
      '-crf',
      '23',
      // video codec
      '-c:v',
      'libx264',
      //audio codec
      '-c:a',
      'aac',
      // overwrite file
      '-y',
      `${videoFilepath}`, // output file
    ];

    if (filePath.endsWith('mp3')) {
      const imgPath = join(
        this.pathService.getAssetsDirectory(),
        'coverimage.jpg',
      );
      const indexOfVideoInput = commands.indexOf('-i'); // place img input 2 indexes after audio input
      commands.splice(indexOfVideoInput + 2, 0, `-i`, imgPath);
    }
    // await this.execShellCommand(commands);
    await this.execAsStream(commands);
  }

  async createWavFile(projectId: string, video: Video, audio: Audio) {
    const videoFilepath = this.pathService.getMediaFile(projectId, video);
    // const audioFilepath = this.pathService.getWavFile(projectId);
    const audioFilepath = this.pathService.getMediaFile(projectId, audio);

    const commands = [
      '-i',
      videoFilepath,
      '-ac',
      '1', // reduce to mono
      audioFilepath,
    ];
    await this.execAsStream(commands);
  }

  async createMp3File(projectId: string, video: Video, audio: Audio) {
    const videoFilepath = this.pathService.getMediaFile(projectId, video);
    // const audioFilepath = this.pathService.getMp3File(projectId);

    const audioFilepath = this.pathService.getMediaFile(projectId, audio);

    const commands = [
      '-i',
      videoFilepath,
      '-ac',
      '1', // reduce to mono
      audioFilepath,
    ];
    await this.execAsStream(commands);
  }

  public async getVideoDuration(projectId: string, video: Video) {
    const videoFilepath = this.pathService.getMediaFile(projectId, video);
    const commands = [
      this.ffprobe, // `ffprobe`,
      '-loglevel',
      'fatal',
      // error = Show all errors, including ones which can be recovered from.
      // fatal = Only show fatal errors which could lead the process to crash, such as an assertion failure.
      '-i',
      `${videoFilepath}`,
      '-print_format',
      'json',
      '-show_entries',
      'format=duration',
    ];

    // result = {"format":{"duration":number}}
    const result: string = await this.execShellCommand(commands);
    const durationMs: number = Math.floor(
      JSON.parse(result).format.duration * 1000,
    );
    return durationMs;
  }

  /**
   * exec shell command with ffmpeg env
   *
   * logger will print stderr
   * resolve with stdout
   * reject with error
   */
  private async execShellCommand(cmd: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(
        cmd.join(' '),
        {
          maxBuffer: 100 * 1024 * 1024 * 1024,
        },
        (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            if (stderr) {
              // output -> The stderr dump is cosmetic and meant for humans, we do not offer guarantee of stability
              this.logger.debug(stderr);
            }

            resolve(stdout); //stdout used to pipe stuff to other processes
          }
        },
      );
    });
  }

  /**
   * exec shell command with and pipe response to a stream
   */
  private execAsStream(args: string[]): Promise<any> {
    const child = spawn(this.ffmpeg, args);

    const stdout = [];
    const stderr = [];

    return new Promise((resolve, reject) => {
      child.stdout.on('data', (chunk) => stdout.push(chunk));
      child.stderr.on('data', (chunk) => stderr.push(chunk));

      child.on('error', (err) => reject(err));

      child.on('close', (code) => {
        if (code !== 0) {
          const error = Buffer.concat(stderr).toString();
          reject(new Error(error));
        } else {
          resolve(Buffer.concat(stdout));
        }
      });
    });
  }

  public _normalizeData(
    maximum: number,
    reducedData: any[],
    waveformNormalizedMax: number,
  ) {
    const multiplier = waveformNormalizedMax / maximum;
    const normalizedData = new Array(reducedData.length);
    let normalizedMaximum = -Infinity;
    let normalizedMinimum = +Infinity;
    for (let i = 0; i < reducedData.length; i++) {
      const value = reducedData[i];

      // Normalize value
      const normalizedValue = Math.round(value * multiplier);
      normalizedData[i] = normalizedValue;

      // Set normalized minimum and maximum
      normalizedMaximum = Math.max(normalizedMaximum, normalizedValue);
      normalizedMinimum = Math.min(normalizedMinimum, normalizedValue);
    }

    const waveformData: WaveformData = {
      min: normalizedMinimum,
      max: normalizedMaximum,
      values: normalizedData,
    };
    return waveformData;
  }

  public _reduceSampleRate(
    data: number[],
    analyzingSamplerate: number,
    storedSamplesPerSecond: number,
  ) {
    const chunkSize = analyzingSamplerate / storedSamplesPerSecond;
    const numChunks = Math.floor(data.length / chunkSize);
    const reducedData = new Array(numChunks);
    let maximum = -Infinity;
    let minimum = +Infinity;
    for (let chunkIndex = 0; chunkIndex < numChunks; chunkIndex++) {
      /**
       * Round array index on each iteration to avoid an offset and provide upsampling functionality
       */
      const start = Math.round(chunkIndex * chunkSize);
      const end = Math.round(start + chunkSize);
      const slice = data.slice(start, end + 1);
      const values = slice.map((o) => Math.abs(o)); // Make all values positive
      const average = Math.floor(
        values.reduce((a, b) => a + b) / values.length,
      );

      const value = average;
      reducedData[chunkIndex] = value;

      // Set minimum and maximums
      minimum = Math.min(minimum, value);
      maximum = Math.max(maximum, value);
    }
    return { maximum, reducedData };
  }
}
