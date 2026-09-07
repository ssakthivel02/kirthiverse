export interface KvsFoundationProvenanceEntry {
  lessonId: string
  sourceState: 'source-verified'
  sources: { title: string; url: string }[]
  note: string
}

export const kvsFoundationProvenance: KvsFoundationProvenanceEntry[] = [
  {
    lessonId: 'KVS-MATH-A03-L03-SHAPE-001',
    sourceState: 'source-verified',
    sources: [
      {
        title: 'UK Department for Education — Development Matters',
        url: 'https://www.gov.uk/government/publications/development-matters--2/development-matters',
      },
      {
        title: 'UK Department for Education — National curriculum in England: mathematics programmes of study',
        url: 'https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study',
      },
    ],
    note: 'Supports early spatial reasoning with rotated/manipulated shapes and recognition/description of common 2D shapes by properties.',
  },
  {
    lessonId: 'KVS-SCI-A03-L02-OBSERVE-001',
    sourceState: 'source-verified',
    sources: [
      {
        title: 'UK Department for Education — National curriculum in England: science programmes of study',
        url: 'https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study/national-curriculum-in-england-science-programmes-of-study',
      },
    ],
    note: 'Supports observing closely, identifying/classifying, comparing simple physical properties and stating clear grouping rules.',
  },
  {
    lessonId: 'KVS-TAM-A03-L03-MEI-001',
    sourceState: 'source-verified',
    sources: [
      {
        title: 'Tamil Virtual Academy — தமிழ் எழுத்து முறை',
        url: 'https://www.tamilvu.org/ta/courses-degree-a051-a0511-html-a05112l2-9410',
      },
    ],
    note: 'Supports the classification of the eighteen மெய்யெழுத்துகள் and the use of the pulli in pure consonant forms such as க்.',
  },
  {
    lessonId: 'KVS-ENG-A03-L02-RHYME-001',
    sourceState: 'source-verified',
    sources: [
      {
        title: 'UK Department for Education — Development Matters',
        url: 'https://www.gov.uk/government/publications/development-matters--2/development-matters',
      },
    ],
    note: 'Supports early phonological awareness through listening for rhyme and syllable/word rhythms before formal spelling mastery.',
  },
  {
    lessonId: 'KVS-MATH-A05-L04-BONDS-001',
    sourceState: 'source-verified',
    sources: [
      {
        title: 'UK Department for Education — National curriculum in England: mathematics programmes of study',
        url: 'https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study',
      },
    ],
    note: 'Supports representing and reasoning with number bonds to 10/20 and associated subtraction facts using practical and pictorial representations.',
  },
  {
    lessonId: 'KVS-CT-A05-L02-IO-001',
    sourceState: 'source-verified',
    sources: [
      {
        title: 'National Centre for Computing Education — Primary computing glossary',
        url: 'https://teachcomputing.org/primary-computing-glossary',
      },
      {
        title: 'National Centre for Computing Education — Teaching Computing Systems and Networks to 5- to 11-year-olds',
        url: 'https://teachcomputing.org/courses/CO042/teaching-computing-systems-and-networks-to-5-to-11-year-olds',
      },
    ],
    note: 'Supports the input-process-output model and age-appropriate distinction between data/actions entering a system and results produced by it.',
  },
]
