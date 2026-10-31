'use strict';



const $ = id => document.getElementById(id);
let current = 0;
let score = 0;
let answered = false;
let mistakes = [];
let participation;

function createParticipation() {
  const id = crypto.randomUUID();
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2,'0')).join('');
  const queue = [];
  let running = false;
  const notice = $('save-status');
  async function flush() {
    if (running || !queue.length) return;
    running = true;
    notice.textContent = 'Salvando participação anônima…';
    try {
      while (queue.length) {
        let saved = false;
        for (let retry = 0; retry < 3; retry++) {
          try {
            const response = await fetch('/api/quiz', {method:'POST',headers:{'Content-Type':'application/json'},
              body:JSON.stringify({id,token,...queue[0]}),signal:AbortSignal.timeout(10000)});
            if (!response.ok) throw new Error('save');
            saved = true;
            break;
          } catch {
            if (retry < 2) await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)));
          }
        }
        if (!saved) throw new Error('save');
        queue.shift();
      }
      notice.textContent = 'Participação anônima salva.';
      $('retry-save').classList.add('hidden');
    } catch {
      notice.textContent = 'Não foi possível salvar todos os dados desta participação. Você pode continuar jogando. Tente salvar novamente antes de sair.';
      $('retry-save').classList.remove('hidden');
    } finally { running = false; }
  }
  $('retry-save').onclick = flush;
  return event => { queue.push(event); void flush(); };
}

function showScreen(id) {
  ['welcome','quiz','result'].forEach(screen => $(screen).classList.toggle('hidden', screen !== id));
}
function focusHeading(id) {
  $(id).focus({preventScroll:true});
  window.scrollTo({top:0,behavior:'instant'});
}
function start() {
  current = 0; score = 0; answered = false; mistakes = [];
  participation = createParticipation();
  participation({action:'start'});
  showScreen('quiz');
  renderQuestion();
}
function renderQuestion() {
  const q = questions[current];
  answered = false;
  $('question-count').textContent = `Pergunta ${current + 1} de ${questions.length}`;
  $('score').textContent = score;
  $('progress').value = current;
  $('topic').textContent = q.topic.toUpperCase();
  $('question-title').textContent = q.question;
  $('answers').replaceChildren();
  $('feedback').className = 'feedback hidden';
  $('feedback').replaceChildren();
  $('next').classList.add('hidden');
  $('next').innerHTML = `${current === questions.length - 1 ? 'Ver meu resultado' : 'Próxima pergunta'} <span aria-hidden="true">→</span>`;
  q.options.forEach((option,index) => {
    const button = document.createElement('button');
    button.className = 'answer';
    const letter = document.createElement('span');
    letter.className = 'answer-letter';
    letter.textContent = 'ABC'[index];
    letter.setAttribute('aria-hidden','true');
    const label = document.createElement('span');
    label.textContent = option;
    button.append(letter,label);
    button.addEventListener('click',() => answer(index));
    $('answers').append(button);
  });
  focusHeading('question-title');
}
function answer(index) {
  if (answered) return;
  answered = true;
  participation({action:'answer', index:current, choice:index});
  const q = questions[current];
  const correct = index === q.correct;
  if (correct) score += 10;
  else mistakes.push(q);
  [...$('answers').children].forEach((button,i) => {
    button.disabled = true;
    if (i === q.correct) button.classList.add('correct');
    if (i === index && !correct) button.classList.add('wrong');
  });
  $('score').textContent = score;
  $('progress').value = current + 1;
  const title = document.createElement('strong');
  title.textContent = correct ? 'Boa escolha! +10 pontos' : `Vamos aprender! A resposta correta é ${'ABC'[q.correct]}.`;
  const explanation = document.createElement('span');
  explanation.textContent = q.explanation;
  $('feedback').className = `feedback${correct ? '' : ' error'}`;
  $('feedback').replaceChildren(title,explanation);
  $('next').classList.remove('hidden');
  $('next').focus({preventScroll:true});
}
function finish() {
  participation({action:'finish'});
  showScreen('result');
  const whatsappMessage = 'Olá! Fiz seu quiz de vendas e gostaria de saber mais sobre o e-book.';
  const whatsappUrl = `https://wa.me/5511912046002?text=${encodeURIComponent(whatsappMessage)}`;
  $('result').innerHTML = `
    <div class="eyebrow">DESAFIO CONCLUÍDO</div>
    <h1 id="result-title" tabindex="-1">Gostou desse quiz? <span>Você também pode aprender a criar o seu!</span></h1>
    <p class="result-intro">Descubra como usar estratégias digitais para divulgar produtos, atrair clientes e desenvolver seu negócio na internet.</p>
    <div class="result-card">
      <span class="tag">SEU DESEMPENHO NO TREINAMENTO</span>
      <div class="result-score">${score}<span> / 80 pontos</span></div>
      <p>Você acertou ${score / 10} de 8 perguntas. Cada passo conta para uma divulgação mais consciente.</p>
      <div class="review"><h2>${mistakes.length ? 'O que vale revisar' : 'Você acertou todas!'}</h2><div id="review-content"></div></div>
      <section class="purchase" aria-labelledby="purchase-title">
        <span class="tag">E-BOOK DIVULGUE E VENDA</span>
        <h2 id="purchase-title">Quer começar a aprender sobre vendas digitais?</h2>
        <p>Conheça o e-book <strong>“Divulgue e Venda”</strong>, para quem quer aprender sobre divulgação de produtos e vendas nas redes sociais.</p>
        <p class="product-scope">A proposta do e-book apresentado aqui é o aprendizado sobre divulgação e vendas nas redes sociais. A criação de quizzes não é apresentada como conteúdo incluído.</p>
        <p class="price"><span>Preço</span> R$ 17,90</p>
        <a id="purchase-link" class="primary" href="https://pay.kiwify.com.br/jKQrTqC" target="_blank" rel="noopener noreferrer">💚 QUERO GARANTIR MEU E-BOOK</a>
        <small>Checkout Kiwify · abre em uma nova aba.</small>
      </section>
      <section class="contact" aria-labelledby="contact-title">
        <h2 id="contact-title">Quer saber mais? Entre em contato!</h2>
        <p>Tem alguma dúvida sobre o e-book ou quer saber mais sobre o quiz? Fale comigo pelo WhatsApp!</p>
        <a id="whatsapp-link" class="primary secondary" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">💬 TIRAR DÚVIDAS NO WHATSAPP</a>
        <small>Abre o WhatsApp em uma nova aba com uma mensagem pronta para você enviar.</small>
      </section>
      <div class="mission"><span class="tag">SUA PRÓXIMA MISSÃO</span><h2>Agora é hora de praticar.</h2><p>Escreva uma divulgação explicando o que é o e-book, para quem serve, o que inclui e o preço de R$ 17,90.</p><small>Confira o conteúdo real do e-book antes de escrever. Pratique onde preferir, sem enviar dados pessoais.</small></div>
      <button id="restart" class="primary">Jogar novamente <span aria-hidden="true">↻</span></button>
    </div>`;
  if (mistakes.length) {
    const list = document.createElement('ul');
    mistakes.forEach(q => {
      const item = document.createElement('li');
      item.textContent = `${q.topic}: ${q.review}`;
      list.append(item);
    });
    $('review-content').append(list);
  } else {
    $('review-content').textContent = 'Continue praticando os oito assuntos e use o que aprendeu na missão abaixo.';
  }
  $('restart').addEventListener('click',start);
  focusHeading('result-title');
}
$('start').addEventListener('click',start);
$('next').addEventListener('click',() => {
  if (!answered) return;
  if (current === questions.length - 1) finish();
  else { current += 1; renderQuestion(); }
});
