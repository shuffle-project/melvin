import {
  Component,
  ElementRef,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { PushPipe } from '@ngrx/component';
import { AngularNodeViewComponent, NgxTiptapModule } from 'ngx-tiptap';
import { combineLatest, map, Subject } from 'rxjs';
import { TiptapEditorService } from '../tiptap-editor.service';

@Component({
  selector: 'app-tiptap-paragraph',
  standalone: true,
  imports: [NgxTiptapModule, PushPipe],
  templateUrl: './tiptap-paragraph.component.html',
  styleUrl: './tiptap-paragraph.component.scss',
})
export class TiptapParagraphComponent
  extends AngularNodeViewComponent
  implements OnInit, OnChanges
{
  private speakerId = new Subject<string>();

  public showSpeaker = false;
  public speakerName$ = combineLatest([
    this.speakerId,
    this.tiptapEditorService.speakers$,
  ]).pipe(
    map(([id, speakers]) => {
      const speakerName =
        speakers.find((speaker) => speaker.id === id)?.name || 'Unknown';
      console.log(speakerName);
      return speakerName;
    })
  );

  constructor(
    private elementRef: ElementRef,
    private tiptapEditorService: TiptapEditorService
  ) {
    super();
  }

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
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
    // console.log(hasFocus, speakerId, prevSpeakerId);

    this.showSpeaker = hasFocus || speakerId !== prevSpeakerId;
    this.speakerId.next(speakerId);

    console.log(this.showSpeaker, speakerId);
  }

  public onClickSpeaker() {}
}
