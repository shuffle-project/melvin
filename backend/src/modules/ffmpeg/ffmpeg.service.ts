import { Injectable } from '@nestjs/common';
import { exec, spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import { exists, move } from 'fs-extra';
import { rm } from 'fs/promises';
import { join } from 'path';
import { isSameObjectId } from 'src/utils/objectid';
import { DbService } from '../db/db.service';
import { Export } from '../db/schemas/export.schema';
import {
  Audio,
  Project,
  Resolution,
  Video,
} from '../db/schemas/project.schema';
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
  //  HOW MUCH THREADS
  //  -threds 0,1,...
  // https://superuser.com/questions/155305/how-many-threads-does-ffmpeg-use-by-default

  private ffmpeg = ffmpegPath;
  private ffprobe = ffprobePath.path;

  constructor(
    private logger: CustomLogger,
    private pathService: PathService,
    private db: DbService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  public async getWaveformData(
    project: Project,
    audio: Audio,
  ): Promise<WaveformData> {
    const projectId = project._id.toString();
    // const videoFilepath = this.pathService.getVideoFile(projectId);
    // const audioFilepath = this.pathService.getMp3File(projectId);
    const audioFilepath = this.pathService.getAudioFile(
      projectId,
      audio,
      false,
    );
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

  public async getCalculatedResolutions(
    filePath: string,
  ): Promise<Resolution[]> {
    const resolution = await this._getVideoResolution(filePath);

    const calculatedResolutions = this._calculateResolutions(
      resolution.width,
      resolution.height,
    );

    return calculatedResolutions;
  }

  _getVideoSettings(resolution: string): string[] {
    switch (resolution) {
      case '240p':
        return ['-maxrate', '700K', '-bufsize', '1400K'];
      case '360p':
        return ['-maxrate', '1M', '-bufsize', '2M'];
      case '480p':
        return ['-maxrate', '2.5M', '-bufsize', '5M'];
      case '720p':
        return ['-maxrate', '5M', '-bufsize', '10M'];
      case '1080p':
        return ['-maxrate', '8M', '-bufsize', '16M'];
      case '1440p':
        return ['-maxrate', '16M', '-bufsize', '32M'];
      case '2160p':
        return ['-maxrate', '35M', '-bufsize', '70M'];
    }

    return [];
  }

  public async processAudioToVideo(
    projectId: string,
    inputpath: string,
    outputpath: string,
  ): Promise<void> {
    this.logger.verbose('Converting audio to video: ' + projectId);

    const imgPath = join(
      this.pathService.getAssetsDirectory(),
      'coverimage.jpg',
    );

    if (inputpath === outputpath) {
      await move(inputpath, inputpath + '_temp');
      inputpath = inputpath + '_temp';
    }

    const commands = [
      // this.ffmpeg,
      '-loglevel',
      'error',
      // error = Show all errors, including ones which can be recovered from.
      // fatal = Only show fatal errors which could lead the process to crash, such as an assertion failure.
      '-loop',
      '1',
      '-i',
      imgPath,
      '-i',
      `${inputpath}`,
      '-vf',
      'scale=426:240',
      '-tune',
      'stillimage',
      '-shortest',
      outputpath,
    ];
    await this.execAsStream(commands);

    if (inputpath.endsWith('_temp')) {
      const tempFileExists = await exists(inputpath);
      if (tempFileExists) {
        await rm(inputpath);
      }
    }
  }

  public async processVideoFile(
    filePath: string,
    projectId: string,
    video: Video,
    resolutions: Resolution[],
  ): Promise<void> {
    this.logger.verbose(
      'Processing video file: ' +
        resolutions.map((res) => res.resolution).join(', '),
    );
    if (resolutions.length === 0) {
      // no resolutions to process
      this.logger.verbose('Skip video');
      return;
    }

    const baseVideoFilepath = this.pathService.getBaseMediaFile(
      projectId,
      video,
    );

    const commands = [
      // this.ffmpeg,
      '-loglevel',
      'error',
      // error = Show all errors, including ones which can be recovered from.
      // fatal = Only show fatal errors which could lead the process to crash, such as an assertion failure.
      '-i',
      `${filePath}`,
    ];

    resolutions.forEach((res) => {
      commands.push(
        ...[
          // crf on 51 -> max qual loss, on 0 -> zero qual loss, 23 is default
          '-crf',
          '23',
          '-tune',
          'zerolatency',
          // video codec
          '-c:v',
          'libx264',
          //audio codec
          // '-c:a',
          // 'aac',
          '-an',
          // preset
          '-preset',
          'fast',
          // video settings
          ...this._getVideoSettings(res.resolution),
          // overwrite file
          '-y',
          '-vf',
          `scale=${res.width}:${res.height},fps=30`,
          `${baseVideoFilepath.replace('.mp4', '_' + res.resolution + '.mp4')}`, // output file
        ],
      );
    });

    if (filePath.endsWith('mp3')) {
      const imgPath = join(
        this.pathService.getAssetsDirectory(),
        'coverimage.jpg',
      );
      const indexOfVideoInput = commands.indexOf('-i'); // place img input 2 indexes after audio input
      commands.splice(indexOfVideoInput + 2, 0, `-i`, imgPath);
    }
    // await this.execShellCommand(commands);
    const start = Date.now();
    await this.execAsStream(commands);
    const end = Date.now();
    var seconds = (end - start) / 1000;
    this.logger.verbose(seconds + 's');

    // save resolutions to db
    const project = await this.db.projectModel.findById(projectId);
    const index = project.videos.findIndex((v) =>
      isSameObjectId(v._id, video._id),
    );
    if (!project.videos[index].resolutions)
      project.videos[index].resolutions = [];
    project.videos[index].resolutions.push(...resolutions);
    await project.save();
  }

  /**
   *  useVideopath used in migration, it will take this path instead of the high res video
   */
  async createMp3File(projectId: string, video: Video, audio: Audio) {
    const videoFilepath = this.pathService.getBaseMediaFile(projectId, video);
    // const audioFilepath = this.pathService.getMp3File(projectId);

    const audioFilepathStereo = this.pathService.getAudioFile(
      projectId,
      audio,
      true,
    );
    const audioFilepathMono = this.pathService.getAudioFile(
      projectId,
      audio,
      false,
    );

    const commands = [
      '-i',
      videoFilepath,
      // for mp3 audio quality
      '-q:a',
      '3',
      // mono
      '-map',
      '0:a',
      '-ac',
      '1',
      audioFilepathMono,
      // stereo
      '-map',
      '0:a',
      '-ac',
      '2',
      audioFilepathStereo,
    ];
    await this.execAsStream(commands);
  }

  async bakeSubtitlesInMp4(
    projectId: string,
    video: Video,
    subtitleFile: string,
    exportObj: Export,
  ) {
    const videoFilepath = this.pathService.getVideoFile(projectId, video);
    const exportFilepath = this.pathService.getBaseMediaFile(
      projectId,
      exportObj,
    );

    const commands = [
      '-i',
      videoFilepath,
      '-vf',
      'subtitles=' + subtitleFile,
      '-c:a',
      'copy',
      exportFilepath,
    ];
    await this.execAsStream(commands);
  }

  public async _getVideoResolution(
    filepath: string,
  ): Promise<{ width: number; height: number }> {
    try {
      const commands = [
        this.ffprobe, // `ffprobe`,
        '-loglevel',
        'fatal',
        // error = Show all errors, including ones which can be recovered from.
        // fatal = Only show fatal errors which could lead the process to crash, such as an assertion failure.
        '-i',
        `${filepath}`,
        '-select_streams',
        'v:0',
        '-show_entries',
        'stream=width,height',
        '-of',
        'csv=p=0',
        '-print_format',
        'json',
      ];

      const result: string = await this.execShellCommand(commands);
      const width: number = Math.floor(JSON.parse(result).streams[0]?.width);
      const height: number = Math.floor(JSON.parse(result).streams[0]?.height);
      return {
        width: isNaN(width) ? 0 : width,
        height: isNaN(height) ? 0 : height,
      };
    } catch (e) {
      this.logger.error('Error getting video resolution. setting to 0:0');
      return { width: 0, height: 0 };
    }
  }

  public async getVideoDuration(projectId: string, video: Video) {
    const videoFilepath = this.pathService.getVideoFile(projectId, video);
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

  _calculateResolutions(width: number, height: number): Resolution[] {
    const resolutions: Resolution[] = [];

    // [240, 360, 480, 720, 1080, 1440, 2160,4320]
    [240, 360, 480, 720, 1080].forEach((targetHeight) => {
      if (height >= targetHeight) {
        resolutions.push({
          resolution: targetHeight + 'p',
          ...this._scaleResolution(targetHeight, width, height),
        });
      }
    });
    // add at least min resolution
    if (resolutions.length === 0)
      resolutions.push({ resolution: '240p', width: 426, height: 240 });
    return resolutions;
  }

  _scaleResolution(scaleTo: number, width: number, height: number) {
    const aspectRatio = width / height;
    const scaledWidth = Math.round(scaleTo * aspectRatio);

    return {
      width: this._isEven(scaledWidth) ? scaledWidth : scaledWidth + 1,
      height: scaleTo,
    };
  }

  _isEven(n: number): boolean {
    return n % 2 == 0;
  }
}
