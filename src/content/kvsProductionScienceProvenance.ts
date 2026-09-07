export interface KvsScienceProvenanceEntry {
  lessonId: string
  sourceState: 'source-verified'
  sources: { title: string; url: string }[]
  note: string
}

export const kvsScienceProvenance: KvsScienceProvenanceEntry[] = [
  {
    lessonId: 'KVS-SCI-A07-L03-LIFECYCLE-001',
    sourceState: 'source-verified',
    sources: [
      {
        title: 'UK Department for Education — National curriculum in England: science programmes of study',
        url: 'https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study/national-curriculum-in-england-science-programmes-of-study',
      },
    ],
    note: 'Supports age-appropriate treatment of life cycles and reproduction in plants and animals.',
  },
  {
    lessonId: 'KVS-SCI-A09-L03-MUSCLEBONE-001',
    sourceState: 'source-verified',
    sources: [
      {
        title: 'UK Department for Education — National curriculum in England: science programmes of study',
        url: 'https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study/national-curriculum-in-england-science-programmes-of-study',
      },
      {
        title: 'OpenStax Anatomy & Physiology 2e — Skeletal Muscle',
        url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/10-2-skeletal-muscle',
      },
    ],
    note: 'Supports the relationship between bones, joints and skeletal-muscle contraction.',
  },
  {
    lessonId: 'KVS-SCI-A09-L04-PLANTREPRO-001',
    sourceState: 'source-verified',
    sources: [
      {
        title: 'UK Department for Education — National curriculum in England: science programmes of study',
        url: 'https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study/national-curriculum-in-england-science-programmes-of-study',
      },
      {
        title: 'OpenStax Biology 2e — Pollination and Fertilization',
        url: 'https://openstax.org/books/biology-2e/pages/32-2-pollination-and-fertilization',
      },
    ],
    note: 'Supports the simplified sequence from pollination through fertilisation, seed development and later dispersal.',
  },
  {
    lessonId: 'KVS-SCI-A11-L05-DIGEST-001',
    sourceState: 'source-verified',
    sources: [
      {
        title: 'NIDDK/NIH — Your Digestive System & How it Works',
        url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works',
      },
    ],
    note: 'Supports the digestive-tract sequence, digestion and nutrient/water absorption statements used in the lesson.',
  },
  {
    lessonId: 'KVS-SCI-A13-L04-ORGSYS-001',
    sourceState: 'source-verified',
    sources: [
      {
        title: 'OpenStax Anatomy & Physiology 2e — Structural Organization of the Human Body',
        url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/1-2-structural-organization-of-the-human-body',
      },
      {
        title: 'UK Department for Education — National curriculum in England: science programmes of study',
        url: 'https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study/national-curriculum-in-england-science-programmes-of-study',
      },
    ],
    note: 'Supports the cell → tissue → organ → organ-system hierarchy used for biological organisation.',
  },
  {
    lessonId: 'KVS-SCI-A15-L04-MITOSIS-001',
    sourceState: 'source-verified',
    sources: [
      {
        title: 'NIH/NIGMS — Make Like a Cell and Split: Comparing Mitosis and Meiosis',
        url: 'https://nigms.nih.gov/biobeat/2021/09/make-like-a-cell-and-split-comparing-mitosis-and-meiosis',
      },
      {
        title: 'NCBI Bookshelf — Genetics, Mitosis',
        url: 'https://www.ncbi.nlm.nih.gov/books/NBK482449/',
      },
    ],
    note: 'Supports the corrected distinction that DNA replication occurs before mitosis and mitosis separates copied chromosomes.',
  },
]
