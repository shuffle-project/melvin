import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AvatarGroupModule } from '../../../components/avatar-group/avatar-group.module';
import { HeaderModule } from '../../../components/header/header.module';
import { LogoModule } from '../../../components/logo/logo.module';
import { ProjectDetailModule } from '../../../modules/project-detail/project-detail.module';
import { SharedModule } from '../../../modules/shared/shared.module';
import { DurationPipeModule } from '../../../pipes/duration-pipe/duration-pipe.module';
import { CaptionsModule } from './components/captions/captions.module';
import { EditorSettingsModule } from './components/editor-settings/editor-settings.module';
import { JoinLivestreamModalModule } from './components/join-livestream-modal/join-livestream-modal.module';
import { LiveControlsModule } from './components/live-controls/live-controls.module';
import { UserTestControlsModule } from './components/user-test-controls/user-test-controls.module';
import { VideoPlayerModule } from './components/video-player/video-player.module';
import { WaveformModule } from './components/waveform/waveform.module';
import { DialogHelpEditorModule } from './dialog-help-editor/dialog-help-editor.module';
import { EditorRoutingModule } from './editor-routing.module';
import { EditorComponent } from './editor.component';

@NgModule({
    imports: [
        CommonModule,
        EditorRoutingModule,
        DialogHelpEditorModule,
        SharedModule,
        LogoModule,
        WaveformModule,
        CaptionsModule,
        HeaderModule,
        DurationPipeModule,
        MatProgressBarModule,
        VideoPlayerModule,
        AvatarGroupModule,
        MatSlideToggleModule,
        ProjectDetailModule,
        LiveControlsModule,
        EditorSettingsModule,
        JoinLivestreamModalModule,
        UserTestControlsModule,
        EditorComponent,
    ],
    providers: [],
})
export class EditorModule {}
