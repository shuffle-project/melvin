import {
  AfterViewInit,
  Component,
  ElementRef,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { LetDirective, PushPipe } from '@ngrx/component';
import { AngularNodeViewComponent, NgxTiptapModule } from 'ngx-tiptap';
import {
  combineLatest,
  debounceTime,
  firstValueFrom,
  lastValueFrom,
  map,
  merge,
  Subject,
  takeUntil,
} from 'rxjs';
import { TiptapEditorService } from '../tiptap-editor.service';
import { CaptionSpeakerComponent } from '../../../editor/components/captions/caption/caption-speaker/caption-speaker.component';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { SpeakerEntity } from 'src/app/services/api/entities/transcription.entity';
import { AppState } from 'src/app/store/app.state';
import { Store } from '@ngrx/store';
import * as transcriptionsSelector from 'src/app/store/selectors/transcriptions.selector';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { EditSpeakerModalComponent } from './edit-speaker-modal/edit-speaker-modal.component';
import * as editorSelector from 'src/app/store/selectors/editor.selector';

@Component({
  selector: 'app-tiptap-paragraph',
  standalone: true,
  imports: [
    NgxTiptapModule,
    PushPipe,
    MatMenuModule,
    CommonModule,
    LetDirective,
    PushPipe,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    EditSpeakerModalComponent,
  ],
  templateUrl: './tiptap-paragraph.component.html',
  styleUrl: './tiptap-paragraph.component.scss',
})
export class TiptapParagraphComponent
  extends AngularNodeViewComponent
  implements OnInit, OnChanges, OnDestroy
{
  destroy$$ = new Subject<void>();

  public showSpeaker = false;

  public speaker!: string;

  public spellchecking = false;

  constructor(
    private elementRef: ElementRef,
    public tiptapEditorService: TiptapEditorService,
    private store: Store<AppState>
  ) {
    super();
  }

  ngOnInit(): void {
    merge(
      this.tiptapEditorService.speakerChanged$,
      this.tiptapEditorService.speakers$
    )
      .pipe(takeUntil(this.destroy$$), debounceTime(0))
      .subscribe(() => this.updateSpeakerName());

    this.store
      .select(editorSelector.selectSpellchecking)
      .pipe(takeUntil(this.destroy$$))
      .subscribe((selectSpellchecking) => {
        this.spellchecking = selectSpellchecking === 'enabled' ? true : false;
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    const node = changes['node'];
    if (
      !node?.firstChange &&
      node?.previousValue.attrs.speaker !== node?.currentValue.attrs.speaker
    ) {
      this.tiptapEditorService.speakerChanged$.next();
    }
    this.updateSpeakerName();
  }

  ngOnDestroy() {
    this.destroy$$.next();
  }

  private updateSpeakerName() {
    const pos = this.getPos();
    const resolvedPos = this.editor.state.doc.resolve(pos);
    const prevNode = resolvedPos.nodeBefore;

    const previousSpeakerIds: string[] = [];
    this.editor.state.doc.nodesBetween(0, pos, (node, pos) => {
      if (node.type.name === 'paragraph') {
        previousSpeakerIds.push(node.attrs['speaker']);
      }
    });

    const prevSpeakerId =
      previousSpeakerIds.reverse().find((speakerId) => speakerId) || null;

    const speakerId = this.node.attrs['speaker'] || prevSpeakerId;

    const hasFocus =
      this.elementRef.nativeElement.classList.contains('has-focus');

    this.showSpeaker = true;

    const speakers = this.tiptapEditorService.speakers$.getValue();
    this.speaker =
      speakers.find((speaker) => speaker.id === speakerId)?.name || 'Unknown';
  }

  onChangeSpeaker(speaker: SpeakerEntity) {
    const { state, view } = this.editor!;
    const { tr } = state;

    const pos = this.getPos();
    const paragraph = state.doc.nodeAt(pos);

    if (paragraph?.type.name === 'paragraph') {
      const newAttrs = { ...paragraph.attrs, speaker: speaker.id };
      tr.setNodeMarkup(pos, undefined, newAttrs);

      view.dispatch(tr);
    }
  }
}
