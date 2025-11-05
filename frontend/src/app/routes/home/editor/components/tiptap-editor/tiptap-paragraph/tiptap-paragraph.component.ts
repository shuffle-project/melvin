import {
  Component,
  ElementRef,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Store } from '@ngrx/store';
import { AngularNodeViewComponent, NgxTiptapModule } from 'ngx-tiptap';
import { debounceTime, merge, Subject, takeUntil } from 'rxjs';
import { AppState } from 'src/app/store/app.state';
import * as editorSelector from 'src/app/store/selectors/editor.selector';
import { MediaService } from '../../../service/media/media.service';
import { TiptapEditorService } from '../tiptap-editor.service';
import { EditSpeakerModalComponent } from './edit-speaker-modal/edit-speaker-modal.component';

@Component({
  selector: 'app-tiptap-paragraph',
  imports: [
    NgxTiptapModule,
    MatMenuModule,
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

  public speakerName!: string;
  public isSpeakerSet: boolean = false;

  public spellchecking = false;

  constructor(
    private elementRef: ElementRef,
    public tiptapEditorService: TiptapEditorService,
    private store: Store<AppState>,
    private mediaService: MediaService
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
        this.spellchecking = selectSpellchecking;
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    const node = changes['node'];
    if (
      !node?.firstChange &&
      node?.previousValue.attrs.speakerId !== node?.currentValue.attrs.speakerId
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

    const previousSpeakerIds: string[] = [];
    this.editor.state.doc.nodesBetween(0, pos, (node, pos) => {
      if (node.type.name === 'paragraph') {
        previousSpeakerIds.push(node.attrs['speakerId']);
      }
    });

    const prevSpeakerId =
      previousSpeakerIds.reverse().find((speakerId) => speakerId) || null;

    const speakerId = this.node.attrs['speakerId'] || prevSpeakerId;
    this.isSpeakerSet = !!this.node.attrs['speakerId'];

    this.showSpeaker = true;

    const speakers = this.tiptapEditorService.speakers$.getValue();
    this.speakerName =
      speakers.find((speaker) => speaker.id === speakerId)?.name || 'Unknown';
  }

  onChangeSpeaker(speakerId: string) {
    const { state, view } = this.editor!;
    const { tr } = state;

    const pos = this.getPos();
    const paragraph = state.doc.nodeAt(pos);

    if (paragraph?.type.name === 'paragraph') {
      const newAttrs = { ...paragraph.attrs, speakerId: speakerId };
      tr.setNodeMarkup(pos, undefined, newAttrs);

      view.dispatch(tr);
    }
  }

  onClickParagraph(event: MouseEvent) {}
}
