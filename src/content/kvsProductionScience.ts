import type { Lesson } from './lessons'
import type { QuizQuestion } from './quizzes'

function lesson(id: string, category: string, title: string, objectiveEn: string, objectiveTa: string, explanation: string, examples: string[], summary: string, order: number): Lesson {
  return { id, subject: 'Science', category, title, objectives: [objectiveEn, objectiveTa], explanation: `${explanation} தமிழ்: ${objectiveTa}`, examples, summary, difficulty: 'intermediate', duration: 25, order }
}

function mcq(id: string, lessonId: string, question: string, options: string[], correctAnswer: number, explanation: string): QuizQuestion {
  return { id, subject: 'Science', lessonId, type: 'mcq', question, options, correctAnswer, explanation, difficulty: 'medium' }
}

function short(id: string, lessonId: string, question: string, correctAnswer: string, explanation: string): QuizQuestion {
  return { id, subject: 'Science', lessonId, type: 'short-answer', question, correctAnswer, explanation, difficulty: 'medium' }
}

export const kvsScienceLessons: Lesson[] = [
  lesson(
    'KVS-SCI-A07-L03-LIFECYCLE-001',
    'Life Cycles',
    'Life Cycles: Growth and Change',
    'Describe a life cycle as a repeating sequence of stages and compare simple examples without assuming every organism has identical stages.',
    'வாழ்க்கைச் சுழற்சியை நிலைகளின் தொடர்ச்சியாக விவரித்து, எல்லா உயிரினங்களும் ஒரே நிலைகளைப் பகிரும் என கருதாமல் எளிய எடுத்துக்காட்டுகளை ஒப்பிடுதல்.',
    'Living things change as they grow and reproduce. A life cycle describes stages across a generation, and different organisms can have different stages and timings.',
    ['Sequence a flowering plant from seed → seedling → mature plant → flowers/seeds in a simplified model.', 'Compare two stage-card sets and identify similarities and differences.'],
    'Life-cycle diagrams show ordered stages; organisms do not all have identical stages.',
    201,
  ),
  lesson(
    'KVS-SCI-A09-L03-MUSCLEBONE-001',
    'Human Body',
    'Bones, Joints and Muscles Work Together',
    'Explain at an age-appropriate level how bones provide support, joints allow movement, and muscles pull to move body parts.',
    'எலும்புகள் ஆதரவு தருவது, மூட்டுகள் இயக்கத்தை அனுமதிப்பது, தசைகள் இழுப்பதன் மூலம் உடல் பகுதிகளை நகர்த்துவது ஆகியவற்றை வயதிற்கு ஏற்ற முறையில் விளக்குதல்.',
    'Bones provide support and protection. Joints connect bones and allow different ranges or types of movement. Skeletal muscles contract to create tension that is transferred through attachments to pull on bones.',
    ['Model elbow bending as coordinated muscle action across a joint.', 'Compare a rigid connection with a movable joint in a paper model.'],
    'Muscles create pulling tension; different joints allow different movements.',
    202,
  ),
  lesson(
    'KVS-SCI-A09-L04-PLANTREPRO-001',
    'Plant Reproduction',
    'How Flowering Plants Make Seeds',
    'Describe a simplified sequence from pollination to seed formation and distinguish pollination from seed dispersal.',
    'மகரந்தச் சேர்க்கையிலிருந்து விதை உருவாக்கம் வரை எளிய வரிசையை விவரித்து, மகரந்தச் சேர்க்கையையும் விதை பரவலையும் வேறுபடுத்துதல்.',
    'In flowering plants, pollination transfers pollen to the stigma. Fertilisation follows successful pollen transfer and seed development can then occur. Seed dispersal happens later and moves seeds away from the parent plant.',
    ['Order: pollination → fertilisation → seed development → dispersal.', 'Compare the material moved during pollination with the material moved during seed dispersal.'],
    'Pollination and seed dispersal occur at different stages and move different biological material.',
    203,
  ),
  lesson(
    'KVS-SCI-A11-L05-DIGEST-001',
    'Human Digestion',
    'The Digestive System: From Food to Absorbed Nutrients',
    'Trace food through a simplified digestive-system model and distinguish mechanical breakdown, chemical digestion and nutrient absorption.',
    'உணவு செரிமான அமைப்பில் செல்லும் எளிய பாதையைப் பின்தொடர்ந்து, இயந்திர உடைப்பு, இரசாயனச் செரிமானம் மற்றும் ஊட்டச்சத்து உறிஞ்சுதல் ஆகியவற்றை வேறுபடுத்துதல்.',
    'Food passes through the mouth, oesophagus, stomach, small intestine and large intestine. Digestion uses movement and digestive juices to break food into smaller usable parts. Most nutrient absorption occurs in the small intestine; the large intestine absorbs water.',
    ['Trace mouth → oesophagus → stomach → small intestine → large intestine.', 'Sort examples into mechanical breakdown, chemical digestion or absorption.'],
    'Digestion and absorption are linked but different processes across multiple digestive organs.',
    204,
  ),
  lesson(
    'KVS-SCI-A13-L04-ORGSYS-001',
    'Biological Organisation',
    'From Cells to Organ Systems',
    'Explain the hierarchy cell → tissue → organ → organ system and use examples to classify biological organisation correctly.',
    'செல் → திசு → உறுப்பு → உறுப்பு அமைப்பு என்ற உயிரியல் அமைப்பு வரிசையை விளக்கி, எடுத்துக்காட்டுகளை சரியான நிலைகளில் வகைப்படுத்துதல்.',
    'In multicellular organisms, related cells form tissues; tissues contribute to organs; organs work together in organ systems. Organs usually contain multiple tissue types rather than only one kind of cell.',
    ['Classify smooth muscle cell, muscle tissue, stomach and digestive system by level.', 'Explain why the stomach is an organ rather than a tissue.'],
    'Cells form tissues, tissues contribute to organs, and organs work together in organ systems.',
    205,
  ),
  lesson(
    'KVS-SCI-A15-L04-MITOSIS-001',
    'Cell Biology',
    'Mitosis: Making Genetically Similar Body Cells',
    'Explain the role of mitosis in growth and tissue repair using a simplified cell-cycle model and distinguish DNA replication from mitosis itself.',
    'வளர்ச்சி மற்றும் திசு பழுதுபார்ப்பில் mitosis-ன் பங்கை எளிய cell-cycle மாதிரியில் விளக்கி, DNA replication-ஐ mitosis-இலிருந்து வேறுபடுத்துதல்.',
    'DNA is replicated during S phase before mitosis. During mitosis, copied chromosomes are organised and separated so daughter nuclei receive equivalent genetic information; cell division then produces two daughter cells. In multicellular bodies, mitotic division supports growth and replacement or repair of cells.',
    ['Order a simplified cell-cycle sequence: DNA replication before mitosis → chromosome separation during mitosis → cell division.', 'Contrast the outcome of one mitotic division with the common misconception that it creates four cells.'],
    'DNA replication precedes mitosis; mitosis separates copied chromosomes and normally leads to two genetically similar daughter cells.',
    206,
  ),
]

export const kvsScienceQuizzes: QuizQuestion[] = [
  mcq('KVS-Q-SCI-A07-LIFECYCLE-00001','KVS-SCI-A07-L03-LIFECYCLE-001','Which sequence is a reasonable simplified flowering-plant life cycle? — எது எளிய மலர்தாவர வாழ்க்கைச் சுழற்சிக்கான பொருத்தமான வரிசை?',['seed → seedling → mature plant → flowers/seeds','mature plant → rock → seed','seed → mature plant → seedling'],0,'The sequence follows growth from seed to a mature plant that produces the next generation of seeds.'),
  short('KVS-Q-SCI-A07-LIFECYCLE-00002','KVS-SCI-A07-L03-LIFECYCLE-001','Why is a circle often used to draw a life cycle? — வாழ்க்கைச் சுழற்சி ஏன் அடிக்கடி வட்டமாக வரையப்படுகிறது?','It shows that stages recur across generations rather than forming a one-way list forever.','A cycle represents recurring stages across generations.'),
  mcq('KVS-Q-SCI-A07-LIFECYCLE-00003','KVS-SCI-A07-L03-LIFECYCLE-001','Two organisms have different numbers of named stages. Does that mean one has no life cycle? — இரண்டு உயிரினங்களில் பெயரிடப்பட்ட நிலைகளின் எண்ணிக்கை வேறுபட்டால் ஒன்றிற்கு வாழ்க்கைச் சுழற்சி இல்லை என்று பொருளா?',['No; life cycles can have different stages.','Yes; all life cycles must match.'],0,'Different organisms can have different developmental stages.'),
  short('KVS-Q-SCI-A07-LIFECYCLE-00004','KVS-SCI-A07-L03-LIFECYCLE-001','A learner says “a life cycle is only the time when an organism is a baby.” What is missing? — “வாழ்க்கைச் சுழற்சி என்பது குட்டி நிலை மட்டும்” என்ற கூற்றில் என்ன விடுபட்டுள்ளது?','A life cycle includes multiple stages across growth and reproduction, not only the young stage.','The concept covers a sequence of stages across a generation.'),

  mcq('KVS-Q-SCI-A09-MUSCLEBONE-00001','KVS-SCI-A09-L03-MUSCLEBONE-001','Which structure is where two bones meet? — இரண்டு எலும்புகள் சந்திக்கும் இடம் எது?',['joint','muscle','skin'],0,'A joint is a place where bones meet.'),
  short('KVS-Q-SCI-A09-MUSCLEBONE-00002','KVS-SCI-A09-L03-MUSCLEBONE-001','Why are muscles described as pulling rather than pushing bones directly? — தசைகள் எலும்புகளை நேரடியாக தள்ளாமல் இழுக்கின்றன என்று ஏன் கூறப்படுகிறது?','Muscle contraction creates tension that is transferred through attachments to pull on bones.','Contracting skeletal muscle creates pulling tension that can move bones across joints.'),
  mcq('KVS-Q-SCI-A09-MUSCLEBONE-00003','KVS-SCI-A09-L03-MUSCLEBONE-001','A rigid model has two sticks joined with no movable connection. What important limb feature is missing for bending? — நகரும் இணைப்பு இல்லாத இரண்டு குச்சிகள் கொண்ட மாதிரியில் மடக்குவதற்கு எந்த முக்கிய அம்சம் இல்லை?',['a movable joint','more colour','a larger label'],0,'Movement between rigid bones needs a joint that permits movement.'),
  short('KVS-Q-SCI-A09-MUSCLEBONE-00004','KVS-SCI-A09-L03-MUSCLEBONE-001','A learner says every joint in the body moves in exactly the same way. What is the correction? — உடலின் எல்லா மூட்டுகளும் ஒரேபோல் நகரும் என்ற கூற்றைத் திருத்துக.','Different joints allow different ranges and types of movement.','Joint structure and permitted movement vary.'),

  mcq('KVS-Q-SCI-A09-PLANTREPRO-00001','KVS-SCI-A09-L04-PLANTREPRO-001','Which process transfers pollen to the stigma of a flower? — மலரின் stigma-க்கு pollen மாற்றப்படும் செயல்முறை எது?',['pollination','seed dispersal','germination'],0,'Pollination is the transfer of pollen to the stigma.'),
  mcq('KVS-Q-SCI-A09-PLANTREPRO-00002','KVS-SCI-A09-L04-PLANTREPRO-001','Choose the best simplified sequence for a flowering plant. — மலர்தாவரத்திற்கான சிறந்த எளிய வரிசையைத் தேர்வு செய்க.',['pollination → fertilisation → seed development → dispersal','dispersal → pollination → seed development','seed development → pollination → fertilisation'],0,'Pollination precedes fertilisation and seed development; dispersal occurs after seeds form.'),
  short('KVS-Q-SCI-A09-PLANTREPRO-00003','KVS-SCI-A09-L04-PLANTREPRO-001','Why are pollination and seed dispersal not the same process even if wind can be involved in both? — காற்று இரண்டிலும் ஈடுபட்டாலும் pollination மற்றும் seed dispersal ஏன் ஒரே செயல் அல்ல?','They move different biological material at different stages for different roles: pollen versus seeds.','Using the same agent does not make the biological processes identical.'),
  short('KVS-Q-SCI-A09-PLANTREPRO-00004','KVS-SCI-A09-L04-PLANTREPRO-001','A diagram shows seed dispersal before any seed has developed. What is the sequencing problem? — விதை உருவாகுமுன் விதை பரவல் காட்டப்பட்டால் வரிசைப் பிழை என்ன?','Seeds must develop before they can be dispersed.','Dispersal requires seeds to have formed first.'),

  mcq('KVS-Q-SCI-A11-DIGEST-00001','KVS-SCI-A11-L05-DIGEST-001','Which is the best simplified path for food through the digestive tract? — உணவு செரிமானப் பாதையில் செல்லும் சரியான எளிய வரிசை எது?',['mouth → oesophagus → stomach → small intestine → large intestine','stomach → mouth → small intestine','mouth → lungs → stomach'],0,'This follows the main GI-tract sequence.'),
  short('KVS-Q-SCI-A11-DIGEST-00002','KVS-SCI-A11-L05-DIGEST-001','What is the difference between digestion and absorption? — digestion மற்றும் absorption இடையிலான வேறுபாடு என்ன?','Digestion breaks food down; absorption moves usable products across the gut lining into the body’s transport systems.','They are linked but distinct processes.'),
  mcq('KVS-Q-SCI-A11-DIGEST-00003','KVS-SCI-A11-L05-DIGEST-001','A learner says “all digestion happens only in the stomach.” What is the best response? — “செரிமானம் வயிற்றில் மட்டும் நடக்கிறது” என்ற கூற்றுக்கு சிறந்த பதில் எது?',['Digestion involves multiple parts of the digestive system, not only the stomach.','Correct; only the stomach digests food.','Digestion happens only in the large intestine.'],0,'Digestion involves movement and digestive processes across several organs.'),
  mcq('KVS-Q-SCI-A11-DIGEST-00004','KVS-SCI-A11-L05-DIGEST-001','Which organ is especially important for most nutrient absorption? — பெரும்பாலான ஊட்டச்சத்து உறிஞ்சுதலுக்கு முக்கியமான உறுப்பு எது?',['small intestine','oesophagus','mouth'],0,'Most nutrient absorption occurs in the small intestine.'),

  mcq('KVS-Q-SCI-A13-ORGSYS-00001','KVS-SCI-A13-L04-ORGSYS-001','Which order goes from smaller to larger level of biological organisation? — உயிரியல் அமைப்பில் சிறிய நிலையிலிருந்து பெரிய நிலைக்கு சரியான வரிசை எது?',['cell → tissue → organ → organ system','organ → cell → tissue → system','tissue → system → cell → organ'],0,'The standard hierarchy progresses from cells to tissues, organs and organ systems.'),
  short('KVS-Q-SCI-A13-ORGSYS-00002','KVS-SCI-A13-L04-ORGSYS-001','Why is an organ more than just one type of cell? — ஒரு உறுப்பு ஏன் ஒரே வகை செல் மட்டும் அல்ல?','Organs usually contain multiple tissues and specialised cell types working together.','Different tissues contribute different functions within an organ.'),
  mcq('KVS-Q-SCI-A13-ORGSYS-00003','KVS-SCI-A13-L04-ORGSYS-001','The stomach is best classified at which level? — stomach எந்த உயிரியல் அமைப்பு நிலையில் வகைப்படுத்தப்படுகிறது?',['organ','cell','organ system'],0,'The stomach is an organ composed of multiple tissue types.'),
  short('KVS-Q-SCI-A13-ORGSYS-00004','KVS-SCI-A13-L04-ORGSYS-001','A learner labels the digestive system as a tissue. What correction is needed? — digestive system-ஐ tissue என்று குறித்தால் திருத்தம் என்ன?','It is an organ system made of multiple organs working together.','A tissue is a lower level of organisation than an organ system.'),

  short('KVS-Q-SCI-A15-MITOSIS-00001','KVS-SCI-A15-L04-MITOSIS-001','Why must DNA be copied before one cell forms two daughter cells in this simplified cell-cycle model? — ஒரு செல் இரண்டு daughter cells ஆகும் முன் DNA ஏன் நகலெடுக்கப்பட வேண்டும்?','So each daughter cell can receive a complete set of genetic information.','DNA replication prepares copied genetic material for later separation.'),
  mcq('KVS-Q-SCI-A15-MITOSIS-00002','KVS-SCI-A15-L04-MITOSIS-001','How many daughter cells normally result from one mitotic division in this simplified model? — ஒரு mitotic division-இல் பொதுவாக எத்தனை daughter cells உருவாகின்றன?',['2','4','8'],0,'One mitotic division normally leads to two daughter cells.'),
  mcq('KVS-Q-SCI-A15-MITOSIS-00003','KVS-SCI-A15-L04-MITOSIS-001','Which role is closely associated with mitosis in a multicellular body? — multicellular body-ல் mitosis உடன் நெருங்கிய தொடர்புடைய பங்கு எது?',['growth and tissue repair','making all gametes in the same way','digesting food'],0,'Mitotic division supports growth and replacement or repair of many cells.'),
  short('KVS-Q-SCI-A15-MITOSIS-00004','KVS-SCI-A15-L04-MITOSIS-001','A learner says DNA replication happens only after the two daughter cells have completely separated. What is the correction? — இரண்டு daughter cells பிரிந்த பிறகே DNA replication நடக்கும் என்ற கூற்றைத் திருத்துக.','DNA is replicated during S phase before mitosis; mitosis then separates the copied chromosomes before cell division completes.','DNA replication precedes mitosis in the cell cycle; it is not a mitotic phase.'),
]
