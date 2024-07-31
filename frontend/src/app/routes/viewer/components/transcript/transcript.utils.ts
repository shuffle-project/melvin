import { TiptapCaption } from '../../../../services/api/entities/caption.entity';

export function generateTranscript(captions: TiptapCaption[]) {
  if (captions.length === 0) return [];

  const finalTranscriptParagraphs: TiptapCaption[][] = [];

  let tempTranscriptParagraph: TiptapCaption[] = [captions[0]];
  let tempCurrentTextLength = captions[0].text.length;

  let captionIndex = 1; // start at second item, first item is already in temp
  while (captionIndex < captions.length) {
    const captionAtIndex = captions[captionIndex];
    const captionPreviousIndex = captions[captionIndex - 1];

    const speakerChange =
      captionPreviousIndex.speakerId !== captionAtIndex.speakerId;
    const tooLongAndSentenceFinished =
      tempCurrentTextLength > 400 &&
      (captionPreviousIndex.text.endsWith('.') ||
        captionPreviousIndex.text.endsWith('!') ||
        captionPreviousIndex.text.endsWith('?'));
    const wayTooLong = tempCurrentTextLength > 1000;

    if (speakerChange || tooLongAndSentenceFinished || wayTooLong) {
      // speaker change or sentence finished/caption too long -> new Paragraph
      finalTranscriptParagraphs.push(tempTranscriptParagraph);
      tempTranscriptParagraph = [captionAtIndex];
      tempCurrentTextLength = captionAtIndex.text.length;
    } else {
      tempTranscriptParagraph.push(captionAtIndex);
      tempCurrentTextLength += captionAtIndex.text.length;
    }

    const lastCaption = captionIndex === captions.length - 1;
    if (lastCaption) finalTranscriptParagraphs.push(tempTranscriptParagraph);

    captionIndex++;
  }

  if (captions.length === 1) {
    finalTranscriptParagraphs.push(tempTranscriptParagraph);
  }

  //   this.transcriptNew = JSON.parse(JSON.stringify(finalTranscriptParagraphs));
  return finalTranscriptParagraphs;
}
