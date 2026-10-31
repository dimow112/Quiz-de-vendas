'use strict';

const questions = [
  {topic:'Público interessado', question:'Você vai divulgar o e-book. Com quem faz mais sentido começar a conversa?', options:['Com qualquer pessoa, enviando a mesma mensagem para todos.','Com pessoas que querem aprender a divulgar produtos e começar a vender nas redes sociais.','Apenas com quem já tem milhares de seguidores.'], correct:1, explanation:'Procure pessoas com uma necessidade que combine com a proposta do e-book. Entender o que elas querem aprender ajuda você a fazer uma divulgação relevante.', review:'Identificar pessoas interessadas em aprender divulgação e vendas nas redes sociais.'},
  {topic:'Clareza sobre o produto', question:'Alguém pergunta: “O que é o Divulgue e Venda?”. Qual resposta explica melhor?', options:['É um e-book para quem quer aprender sobre divulgação de produtos e vendas nas redes sociais.','É o segredo que resolve todos os seus problemas financeiros.','Compre primeiro que depois você descobre.'], correct:0, explanation:'Diga o que o produto é e para quem serve, usando palavras simples. Evite exageros e não atribua conteúdos ou benefícios que você não verificou.', review:'Explicar o que é o e-book e para quem ele serve, sem exagerar nos benefícios.'},
  {topic:'Uma oferta completa', question:'Você está montando uma oferta. Quais informações ajudam a pessoa a decidir?', options:['Somente uma frase de efeito e o link de compra.','Uma promessa de lucro rápido, mesmo sem evidências.','O que é o e-book, para quem serve, o que inclui de fato, o preço de R$ 17,90 e o link de compra.'], correct:2, explanation:'Uma oferta clara reúne informações para uma decisão consciente. Confira o conteúdo real do produto antes de dizer o que está incluído e apresente o preço de forma visível.', review:'Apresentar produto, público, conteúdo verificado, preço e link na oferta.'},
  {topic:'Publicação útil', question:'Qual publicação entrega valor a quem está começando a divulgar?', options:['Repetir “compre agora” várias vezes, sem explicar nada.','Mostrar um exemplo de como explicar um produto com clareza e conectar a dica à proposta do e-book.','Inventar um depoimento para parecer mais convincente.'], correct:1, explanation:'Uma dica prática ajuda o público antes da compra e mostra por que o assunto pode ser útil. Use exemplos honestos e uma chamada clara para conhecer o e-book.', review:'Criar publicações com dicas práticas, exemplos honestos e uma conexão clara com o produto.'},
  {topic:'Conversa sem pressão', question:'Uma pessoa diz: “Tenho dúvidas se esse e-book serve para mim”. Como responder?', options:['Perguntar o que ela quer aprender, esclarecer com informações verificadas e respeitar a decisão dela.','Insistir até ela comprar, mesmo que peça para parar.','Dizer que a oferta vai acabar hoje, mesmo sem saber disso.'], correct:0, explanation:'Ouça a dúvida e responda com honestidade. Se não souber algo, confira antes de afirmar. A pessoa deve ter espaço para decidir, sem pressão ou urgência inventada.', review:'Ouvir dúvidas, conferir informações e respeitar a decisão de compra.'},
  {topic:'Seu link de afiliado', question:'Você terminou uma divulgação. Por que deve conferir e usar seu próprio link de afiliado?', options:['Porque ele garante que toda pessoa que clicar vai comprar.','Porque qualquer link encontrado na internet identifica você automaticamente.','Porque ele permite identificar sua indicação conforme as condições da plataforma, sem garantir venda ou comissão.'], correct:2, explanation:'O link de afiliado serve para identificar a origem da indicação. Confira se está usando o seu link correto. A atribuição depende das condições aplicáveis; o clique não garante venda ou comissão.', review:'Usar e conferir o próprio link para identificar a indicação, sem prometer atribuição garantida.'},
  {topic:'Expectativas responsáveis', question:'Você quer chamar atenção para o e-book. Qual frase é responsável?', options:['“Aprenda sobre divulgação e vendas; os resultados dependem da aplicação e de outros fatores.”','“Com este e-book, você vai ganhar dinheiro garantido.”','“Você recupera o valor na primeira hora, sem precisar fazer nada.”'], correct:0, explanation:'Um material educativo pode apoiar o aprendizado, mas não garante ganhos ou vendas. Apresente sua proposta com honestidade e deixe claro que os resultados variam.', review:'Comunicar benefícios educativos sem prometer ganhos ou vendas garantidas.'},
  {topic:'Acompanhar e melhorar', question:'Uma publicação teve visualizações, mas poucos cliques. Qual é o próximo passo mais útil?', options:['Concluir que divulgar não funciona e parar de observar os resultados.','Comparar visualizações, cliques e vendas disponíveis, testar uma mensagem mais clara e acompanhar o efeito.','Publicar a mesma mensagem mais vezes e prometer ganhos para aumentar os cliques.'], correct:1, explanation:'Use os resultados disponíveis para aprender. Poucos cliques podem indicar que vale testar a mensagem ou a chamada. Mude um elemento por vez e compare, sem tratar uma métrica isolada como garantia.', review:'Acompanhar visualizações, cliques e vendas e testar melhorias na divulgação.'}
];

const $ = id => document.getElementById(id);
let current = 0;
let score = 0;
let answered = false;
let mistakes = [];

function showScreen(id) {
  ['welcome','quiz','result'].forEach(screen => $(screen).classList.toggle('hidden', screen !== id));
}
function focusHeading(id) {
  $(id).focus({preventScroll:true});
  window.scrollTo({top:0,behavior:'instant'});
}
function start() {
  current = 0; score = 0; answered = false; mistakes = [];
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
