const HF_API_KEY = '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';
const MODEL = 'meta-llama/Llama-3.2-1B-Instruct';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type !== 'EXPLAIN_WORD') return;
  const response = {
    word: request.word,
    type: 'именка',
    gender: 'женски',
    explanations: [
      {
        meaning: 'примена, употреба',
        example: 'Авионот и хеликоптерот се користат за апликација на хербицидите.',
      },
      {
        meaning: 'Ставање или втиснување украс на ткаенина',
        example: 'Ткаенината имаше апликации во вид на цветови со различни бои.',
      },
      {
        meaning: 'формулар за вработување',
        example: 'Ја пополни апликацијата за новото работно место и чекаше одговор.',
      },
      { meaning: 'софтверска програма', example: 'Апликации за обработка на текст и слика.' },
    ],
  };

  sendResponse(response);
  // fetch("https://router.huggingface.co/v1/chat/completions", {
  //   method: "POST",
  //   headers: {
  //     "Authorization": `Bearer ${HF_API_KEY}`,
  //     "Content-Type": "application/json"
  //   },
  //   body: JSON.stringify({
  //     model: MODEL,
  //     messages: [
  //       { role: "system", content: "Објасни збор на македонски." },
  //       { role: "user", content: request.prompt }
  //     ]
  //   })
  // })
  //   .then(res => res.json())
  //   .then(data => {
  //     const text = data.choices?.[0]?.message?.content || null
  //     sendResponse({ text })
  //   })
  //   .catch(() => sendResponse({ text: null }))

  return true;
});
