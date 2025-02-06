// import { Injectable } from '@angular/core';
// import { MatDialog } from '@angular/material/dialog';
// import { MediaCategory } from '../../../services/api/entities/project.entity';
// import { UploadRecordingComponent } from './dialogs/upload-recording/upload-recording.component';
// import {
//   AudioSource,
//   Recording,
//   ScreensharingSource,
//   VideoSource,
// } from './recorder.interfaces';

// @Injectable({
//   providedIn: 'root',
// })
// export class RecorderService {
//   // public recordingMode = false;
//   public recording = false;
//   public recordingPaused = false;

//   public previousDuration = 0;
//   public recordingTimestamp!: number;

//   public title: string = '';
//   public language: string = 'de';

//   // devices

//   public videos: VideoSource[] = [];
//   public audios: AudioSource[] = [];
//   public screensharings: ScreensharingSource[] = [];

//   //recording
//   recordings: Recording[] = [];

//   constructor(public dialog: MatDialog) {}

//   /**
//    * manage devices
//    */

//   async getDevices(
//     type?: 'audioinput' | 'videoinput'
//   ): Promise<MediaDeviceInfo[]> {
//     let enumerate = await navigator.mediaDevices.enumerateDevices();
//     enumerate = enumerate.filter((device) => device.deviceId !== '');

//     return type
//       ? enumerate.filter((device) => device.kind === type)
//       : enumerate;
//   }

//   resetData() {
//     [...this.videos, ...this.screensharings, ...this.audios].forEach((obj) => {
//       this.stopMediastream(obj.mediaStream);
//     });

//     this.videos = [];
//     this.audios = [];
//     this.screensharings = [];
//   }

//   updateMediaCategoryById(id: string, mediaCategory: MediaCategory) {
//     const foundVideo = this.videos.find((obj) => obj.id === id);
//     if (foundVideo) foundVideo.mediaCategory = mediaCategory;

//     const foundScreensharing = this.screensharings.find((obj) => obj.id === id);
//     if (foundScreensharing) foundScreensharing.mediaCategory = mediaCategory;
//   }

//   removeById(id: string) {
//     const v = this.videos.findIndex((x) => x.id === id);
//     if (v >= 0) {
//       this.stopMediastream(this.videos[v].mediaStream);
//       this.videos.splice(v, 1);
//     }

//     const a = this.audios.findIndex((x) => x.id === id);
//     if (a >= 0) {
//       this.stopMediastream(this.audios[a].mediaStream);
//       this.audios.splice(v, 1);
//     }

//     const s = this.screensharings.findIndex((x) => x.id === id);
//     if (s >= 0) {
//       this.stopMediastream(this.screensharings[s].mediaStream);
//       this.screensharings.splice(v, 1);
//     }
//   }

//   stopMediastream(mediaStream: MediaStream | null) {
//     if (mediaStream) {
//       mediaStream.getTracks().forEach((track) => track.stop());
//     }
//   }

//   /**
//    * recording
//    */

//   onPauseMediaRecorder() {
//     this.previousDuration =
//       this.previousDuration + (Date.now() - this.recordingTimestamp);
//     this.recordings.forEach((rec) => rec.mediaRecorder.pause());
//     this.recordingPaused = true;
//   }

//   onResumeMediaRecorder() {
//     this.recordingTimestamp = Date.now();
//     this.recordings.forEach((rec) => rec.mediaRecorder.resume());
//     this.recordingPaused = false;
//   }

//   stopRecording(title: string) {
//     if (!this.recording) return;

//     this.previousDuration = 0;

//     this.title = title;

//     this.recordings.forEach((recording) => {
//       recording.mediaRecorder.stop();
//     });

//     // TODO
//     this.dialog.open(UploadRecordingComponent, {
//       data: { title, recordings: this.recordings },
//       width: '100%',
//       maxWidth: '50rem',
//       maxHeight: '90vh',
//       disableClose: true,
//     });
//   }

//   startRecording() {
//     if (this.recording) return;
//     this.recordingTimestamp = Date.now();

//     // cleanup;
//     this.recordings = []; // TODO

//     // build main audio + video

//     const audioStreams: MediaStream[] = [];
//     this.audios.forEach((audio) => {
//       if (audio.mediaStream) audioStreams.push(audio.mediaStream);
//     });
//     this.screensharings.forEach((screensharing) => {
//       if (
//         screensharing.mediaStream?.getAudioTracks() &&
//         screensharing.mediaStream?.getAudioTracks().length > 0
//       ) {
//         audioStreams.push(screensharing.mediaStream);
//       } else {
//       }
//     });

//     const allVisualSources = [...this.screensharings, ...this.videos];

//     const mainAudioTracks = this.getMergedAudioTracks(...audioStreams);
//     const mainVisualSource = allVisualSources[0];
//     const mainVideoTracks = mainVisualSource.mediaStream!.getVideoTracks();

//     const mainStream = new MediaStream([
//       ...mainAudioTracks, // all audios
//       ...mainVideoTracks, // main video
//     ]);

//     const allStreams = [{ source: mainVisualSource, stream: mainStream }];
//     allVisualSources.forEach((source, i) => {
//       if (i !== 0) allStreams.push({ source, stream: source.mediaStream! });
//     });

//     allStreams.forEach((streamToRecord) => {
//       const chunks: Blob[] = [];
//       const mediaRecorder = new MediaRecorder(streamToRecord.stream);

//       const recording: Recording = {
//         id: streamToRecord.source.id,
//         mediaRecorder: mediaRecorder,
//         chunks,
//         title: streamToRecord.source.title,
//         category: streamToRecord.source.mediaCategory,
//         complete: false,
//         upload: { progress: 0 },
//       };
//       this.recordings.push(recording);

//       mediaRecorder.onerror = (e) => {
//         console.log('error in recording');
//         console.log(recording);
//         console.log(e);
//       };
//       mediaRecorder.ondataavailable = (e) =>
//         this.onDataAvailableMediaRecorder(e, recording);
//       mediaRecorder.onstop = (e) => this.onStopMediaRecorder(e, recording);

//       mediaRecorder.start();

//       this.recording = true;
//     });
//   }

//   onDataAvailableMediaRecorder(e: BlobEvent, recording: Recording) {
//     console.log('onDataAvailableMediaRecorder');
//     if (e.data.size > 0) recording.chunks.push(e.data);
//   }

//   onStopMediaRecorder(e: Event, recording: Recording) {
//     console.log('onStopMediaRecorder');
//     recording.complete = true;

//     // all recordings finished?
//     if (!this.recordings.some((rec) => rec.complete === false)) {
//       // this.finishRecording();
//       this.recording = false;
//     }
//     // recording.mediaRecorder.ondataavailable = null;
//   }

//   getMergedAudioTracks(...streams: MediaStream[]): MediaStreamTrack[] {
//     if (streams.length < 1) {
//       return [];
//     }

//     const audioCtx = new AudioContext();
//     const destination = audioCtx.createMediaStreamDestination();

//     streams.forEach((stream) => {
//       const source = audioCtx.createMediaStreamSource(stream);
//       source.connect(destination);
//     });

//     return destination.stream.getAudioTracks();
//   }
// }
