# Configurar e acessar o painel

O site continua sem cadastro para participantes. O painel em `/admin.html` exige uma conta de administrador do Supabase. A página de login é pública; a API só libera os dados após verificar a sessão e o ID do administrador no servidor. Nenhuma senha ou chave é incluída no GitHub.

## 1. Criar o banco e a conta administrativa

1. Crie um projeto em https://supabase.com/dashboard. Escolha uma senha forte para o banco e mantenha-a no gerenciador de senhas. Escolha a região adequada para seus visitantes.
2. No **SQL Editor**, execute todo o arquivo `database/setup.sql` deste repositório. Ele cria a tabela e funções transacionais e bloqueia o acesso dos papéis `anon` e `authenticated` à tabela e às funções. Não crie políticas públicas de leitura.
3. Em **Authentication → Users**, crie o usuário do administrador com seu e-mail e uma senha forte e exclusiva. Confirme o usuário pelo painel. Copie o UUID desse usuário.
4. Desative novos cadastros públicos nas configurações de Authentication. Não é necessário habilitar login anônimo. O quiz não cria usuários no Supabase.
5. Guarde o e-mail e a senha com segurança. Se esquecer a senha, redefina-a pelas ferramentas administrativas do Supabase. Não há cadastro nem redefinição de senha na página pública do painel.

## 2. Configurar o Netlify

Em **Project configuration → Environment variables**, adicione estas variáveis com escopo **Functions**, no contexto de produção. Nunca as inclua em arquivos públicos, commits ou mensagens:

| Nome | Valor a obter no Supabase |
| --- | --- |
| `SUPABASE_URL` | URL HTTPS do projeto, em Project Settings/API |
| `SUPABASE_ANON_KEY` | Chave pública `anon` do projeto, usada pelo servidor para login |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave secreta `service_role` do projeto, acessível somente às Functions |
| `ADMIN_USER_ID` | UUID exato do único usuário administrador criado acima |

A chave de serviço tem privilégios amplos: marque-a como secreta no Netlify e nunca a coloque no JavaScript do navegador. Se for exposta, substitua-a no Supabase e no Netlify. Não configure credenciais de produção para previews de código não confiável.

Conecte o projeto Netlify à branch `main`. O `netlify.toml` configura:

- Build: `node scripts/build.mjs`.
- Publicação: `dist` (substitui a configuração antiga de publicação `.`).
- Functions: `netlify/functions`.

O build copia somente os sete arquivos públicos necessários. SQL, testes e documentação não são publicados. Não há pacote de frontend ou biblioteca externa para instalar. Use Node.js 22 ou superior no build e nas Functions. Depois de adicionar as variáveis, faça um novo deploy no Netlify. Alterações em variáveis de Functions exigem novo deploy.

## 3. Acessar e validar

1. Acesse o endereço HTTPS do seu site e acrescente `/admin.html`.
2. Entre com o e-mail e a senha do usuário autorizado. A sessão usa cookie `Secure`, `HttpOnly`, `SameSite=Strict`, dura até uma hora e não fica no localStorage. Após expirar, entre novamente. Use **Sair** em computadores compartilhados.
3. Faça uma tentativa no quiz, responda às oito perguntas e clique em **Ver meu resultado**. Aguarde a mensagem **Participação anônima salva**.
4. No painel, clique em **Atualizar**. Confira início, conclusão, pontuação e respostas. Expanda a participação para ver seus detalhes. Datas aparecem no horário de Brasília; o banco guarda instantes em UTC.
5. Teste também uma tentativa incompleta e uma conta que não seja a autorizada. O usuário não autorizado não deve consultar dados, mesmo que tenha uma conta no mesmo projeto Supabase.

Se aparecer indisponibilidade, confira as quatro variáveis, a execução do SQL e o novo deploy. Não compartilhe valores das chaves ou conteúdo de cookies. Verifique erros nas Functions pelo painel do Netlify, sem registrar senhas, corpos de login ou tokens.

## O que os números significam

- **Iniciadas:** tentativas cuja criação foi salva ao clicar em Começar desafio ou Jogar novamente.
- **Finalizadas:** tentativas com oito respostas salvas e confirmação ao abrir o resultado final. Apenas responder a última pergunta, sem avançar ao resultado, ainda conta como em andamento.
- **Pontuação:** calculada pelo banco a partir das alternativas, 10 pontos por acerto, até 80. Uma tentativa incompleta mostra pontuação parcial.
- **Respostas:** alternativa escolhida em cada pergunta, incluindo erros; perguntas não respondidas ficam identificadas.
- Uma pessoa pode gerar várias tentativas. Não medimos pessoas únicas nem vendas na Kiwify.

IDs aleatórios e tokens de gravação ficam apenas na memória da aba. Não coletamos nome, telefone, e-mail, IP ou agente do navegador no banco do quiz. O aviso de registro aparece antes do início. O Netlify e o Supabase podem manter logs operacionais conforme suas políticas; revise acesso, retenção e termos desses serviços. Os botões de compra e WhatsApp abrem serviços externos com suas próprias políticas.

As gravações são sequenciais e idempotentes: uma repetição não duplica respostas nem pontos. Na falha, o quiz continua funcionando e mostra **Tentar salvar novamente**. As respostas pendentes só podem ser recuperadas enquanto a página permanece aberta. Fechar/recarregar a aba ou jogar novamente antes de concluir o salvamento pode perder registros pendentes. Não há promessa de contagem completa em dispositivos offline ou com bloqueadores.

## Segurança e manutenção

- As APIs públicas só permitem criar e gravar uma tentativa por meio de um token aleatório; não permitem listar participações. O banco guarda apenas o hash do token. Respostas são imutáveis e validadas por ordem, e o horário vem do banco.
- O servidor verifica a identidade no Supabase em toda consulta administrativa e compara com `ADMIN_USER_ID`. O ID é configurado apenas no servidor; não há senha de administrador no código.
- Não compartilhe acesso às configurações do Netlify/Supabase. Use autenticação forte nas contas desses provedores. O formulário usa o controle de login do Supabase; ajuste seus limites de tentativas conforme o uso.
- O endpoint de registro é público por necessidade. Tentativas automáticas ainda podem inflar as contagens; configure limites de tráfego/bot protection no Netlify se houver abuso. Os registros são indicadores de treinamento, não prova de identidade nem garantia antifraude.
- Defina sua política de retenção. Para apagar tentativas antigas, execute com acesso administrativo: `delete from public.quiz_attempts where started_at < now() - interval '90 days';`. O período de 90 dias é uma opção, não uma configuração automática. Configure backups e retenção no provedor conforme sua necessidade.
- A estrutura usa a versão `v1` das oito perguntas. Se alterar perguntas ou ordem, versione o conteúdo e o gabarito do banco/painel juntos para preservar o significado dos registros históricos.

## Desenvolvimento

`node --test tests/*.test.mjs` valida os handlers. `node scripts/build.mjs` gera os arquivos estáticos. Um servidor estático simples ainda abre o quiz, mas o registro e o login dependem de Netlify Functions e do Supabase configurado. Nenhuma credencial real é necessária para os testes automatizados com serviços simulados.

A ativação em produção depende de criar o projeto Supabase, executar o SQL, configurar as variáveis e concluir o deploy. A presença dos arquivos no GitHub, sozinha, não cria o banco nem a conta administrativa.
