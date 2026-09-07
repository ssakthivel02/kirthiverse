export interface KvsPrerequisiteProvenanceEntry {
  lessonId: string
  sourceState: 'source-verified'
  sources: { title: string; url: string }[]
  note: string
}

export const kvsPrerequisiteProvenance: KvsPrerequisiteProvenanceEntry[] = [
  {
    lessonId: 'KVS-MATH-A07-L04-DIV-001',
    sourceState: 'source-verified',
    sources: [{
      title: 'UK Department for Education — National curriculum in England: mathematics programmes of study',
      url: 'https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study',
    }],
    note: 'Supports multiplication/division relationships, mental and written division, and interpreting remainders in context.',
  },
  {
    lessonId: 'KVS-TAM-A09-L03-POS-001',
    sourceState: 'source-verified',
    sources: [
      {
        title: 'Tamil Virtual Academy — பெயரும் வினையும்',
        url: 'https://www.tamilvu.org/ta/courses-degree-c021-c0211-html-c0211114-15542',
      },
      {
        title: 'Tamil Virtual Academy — வினைச்சொல்: விளக்கமும் பகுப்பும்',
        url: 'https://www.tamilvu.org/ta/courses-degree-a021-a0212-html-a0212104-6232',
      },
    ],
    note: 'Supports the noun/verb distinction and the important contextual caveat that some Tamil roots/forms can function differently by usage.',
  },
  {
    lessonId: 'KVS-ENG-A13-L02-INFER-001',
    sourceState: 'source-verified',
    sources: [{
      title: 'UK Department for Education — National curriculum in England: English programmes of study',
      url: 'https://www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study/national-curriculum-in-england-english-programmes-of-study',
    }],
    note: 'Supports making inferences with textual evidence and analysing vocabulary choices and their impact.',
  },
  {
    lessonId: 'KVS-CT-A09-L02-DEBUG-001',
    sourceState: 'source-verified',
    sources: [
      {
        title: 'National Centre for Computing Education — Tracing algorithms',
        url: 'https://teachcomputing.org/curriculum/key-stage-4/algorithms-part-1/tracing-algorithms',
      },
      {
        title: 'National Centre for Computing Education — Debugging',
        url: 'https://teachcomputing.org/curriculum/key-stage-1/programming-a-robot-algorithms/debugging',
      },
    ],
    note: 'Supports tracing algorithms, locating logic errors, testing and debugging through focused changes.',
  },
  {
    lessonId: 'KVS-MATH-A13-L03-PYTHAG-001',
    sourceState: 'source-verified',
    sources: [{
      title: 'UK Department for Education — National curriculum in England: mathematics programmes of study',
      url: 'https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study',
    }],
    note: 'Supports use of Pythagoras’ theorem in right-angled triangles and identification/application of right-triangle relationships.',
  },
  {
    lessonId: 'KVS-SCI-A11-L04-FORCE-001',
    sourceState: 'source-verified',
    sources: [{
      title: 'UK Department for Education — National curriculum in England: science programmes of study',
      url: 'https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study/national-curriculum-in-england-science-programmes-of-study',
    }],
    note: 'Supports force arrows, one-dimensional force addition, balanced/unbalanced forces and qualitative changes in motion.',
  },
]
