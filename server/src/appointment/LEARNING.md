# Modulo de Appointment: Notas de Estudo

Esta pasta (`server/src/appointment`) ainda esta como scaffold do NestJS, mas o **modelo de dados ja existe no Prisma** e a **logica de disponibilidade ja existe no modulo `schedule`**. Entao, o aprendizado mais valioso aqui e implementar um fluxo de criacao de agendamentos *correto* em cima de:

- Model Prisma: `Appointment` em `server/prisma/schema.prisma`
- Calculo de disponibilidade: `ScheduleService.getAvailableSlots` em `server/src/schedule/schedule.service.ts`

Abaixo esta um conjunto de topicos/perguntas para estudar enquanto voce implementa o `AppointmentService` de verdade.

## 1) Invariantes de Dominio (O Que Nunca Pode Quebrar)

Defina invariantes primeiro, porque elas decidem sua estrategia de locking/transacao.

- Sem duplo agendamento:
  - O mesmo `employeeId` nao pode ter agendamentos com horarios sobrepostos, excluindo `CANCELED`.
  - Avalie se a sobreposicao e por funcionario, por sala, por recurso, por empresa etc.
- Politica de agenda:
  - Respeitar blocos semanais e excecoes de agenda.
  - `ScheduleType` (`FIXED` vs `FLOATING`) muda as regras de "passo" dos slots (ver schedule service).
- Modelo de status:
  - `SCHEDULED -> COMPLETED | CANCELED | NO_SHOW`
  - Decidir se transicoes sao reversiveis, quem pode executa-las e quais timestamps voce precisa.

Escreva essas invariantes em linguagem simples e depois mapeie para constraints no banco e checagens no codigo.

## 2) Race Conditions: Slots Disponiveis vs Criacao do Agendamento

Bug classico:

1. Cliente A chama `GET /schedule/available-slots` e ve `10:00`.
2. Cliente B faz o mesmo.
3. Ambos chamam `POST /appointment` para `10:00`.
4. Se a criacao for "checa e depois insere" sem constraint/lock, voce pode acabar com duplo agendamento.

Estude:

- Por que "ler slots disponiveis" deve ser tratado como dica, nao como garantia.
- Onde deve viver a *fonte unica da verdade* para detectar conflito: camada de aplicacao vs banco de dados.

## 3) Estrategias de Locking (Otimista vs Pessimista vs Constraints no Banco)

### Opcao A: Sem sobreposicao garantida pelo banco (preferivel para corretude)

No Postgres, a abordagem mais forte e uma **exclusion constraint** em um range de tempo por funcionario, por exemplo:

- Armazenar `startsAt` e `endsAt` (ou `startsAt` + `durationMinutes`, mas calcular `endsAt` na escrita).
- Adicionar uma exclusion constraint em `tstzrange(startsAt, endsAt)` do tipo:
  - "o mesmo employeeId nao pode ter ranges que se sobrepoem quando status != CANCELED"

Notas:

- O schema do Prisma nao expressa exclusion constraints diretamente; normalmente voce adiciona via migration SQL.
- Isso joga a corretude para o DB e simplifica o codigo (basta capturar erro de conflito).

### Opcao B: Lock pessimista

Fazer lock de uma linha por funcionario/dia, ou usar advisory locks do Postgres enquanto cria um agendamento.

Estude:

- `SELECT ... FOR UPDATE` vs advisory locks
- Deadlocks, ordenacao de locks, granularidade (por funcionario vs por funcionario+data)
- Impacto de throughput sob carga

### Opcao C: Controle de concorrencia otimista

Usar um campo de versao ou `updatedAt` como "compare-and-set":

- Exemplo de ideia: atualizar um registro de "reserva de slot" com `WHERE version = ?` e incrementar.

Estude:

- Por que locking otimista ajuda quando conflitos sao raros
- Por que isso *nao* substitui uma garantia real de "sem sobreposicao", a menos que o seu modelo torne conflitos detectaveis como uma escrita versionada

### Opcao D: Concorrencia via transacao (SERIALIZABLE + retry)

Ideia: em vez de "travar" antes, rode o fluxo dentro de uma transacao com isolamento `SERIALIZABLE` e, se o banco abortar por conflito de serializacao, faca retry.

Por que isso funciona:

- O banco tenta garantir que o efeito final seja equivalente a executar as transacoes em fila (uma serializacao).
- Se duas requisicoes concorrentes fizerem "ler -> checar -> inserir" e isso levaria a um estado impossivel de serializar (ex: duplo agendamento), o Postgres pode abortar uma delas. No retry, ela relera e agora vera o novo agendamento, falhando com 409.

Quando escolher:

- Quando o invariante depende de um *conjunto* (ex: "nao pode sobrepor horarios") e nao existe um unico registro "dono" para versionar com `updatedAt`/`version`.
- Quando voce quer evitar lock pessimista manual e espera que conflitos sejam raros/moderados.
- Quando voce quer uma melhoria de corretude com mudanca pequena no codigo (transacao + retry).

Tradeoffs:

- Sob alta contencao pode gerar mais aborts e retries (custo extra e latencia).
- Ainda e recomendavel ter um guardrail no banco quando der (ex: exclusion constraint), porque isso garante o invariante mesmo se alguma parte do codigo "esquecer" a checagem.

## 4) Idempotencia (Retries Sem Duplicar)

Criar agendamento e um otimo lugar para implementar idempotencia:

- Clientes fazem retry por timeout, rede movel, 502 etc.
- Sem idempotencia, retries podem criar agendamentos duplicados.

Ideias de design:

- Aceitar um header `Idempotency-Key` (ou um campo no body).
- Persistir uma tabela `AppointmentRequest` / `IdempotencyKey` com unique constraint em `(companyId, key)`.
- No retry:
  - Se a key existe e ja concluiu com sucesso, retornar o agendamento original.
  - Se a key existe e esta "em andamento", decidir se bloqueia/polla/retorna 409.

Estude:

- Realidade de "exactly-once" vs "at-least-once"
- Escopo da idempotencia (por empresa? por usuario? por endpoint?)
- Idempotencia segura para cancelamento e updates de status tambem

## 5) Bugs de Data/Hora e Fuso (Time Zones)

Agendamento e, em grande parte, bug de data/hora.

Perguntas:

- `appointmentDate` e armazenado como UTC ou como hora local?
- O que o query param `date` significa: data local no fuso da empresa, ou data ISO em UTC?
- Como evitar problemas de DST e "virada do dia"?

Onde olhar:

- `ScheduleService.getAvailableSlots` usa `new Date(date)` e tambem concatenacao de string como `${date}T00:00:00`.
- `ScheduleException.date` e `@db.Date` (somente data), mas `Date` no JS sempre carrega hora e timezone.

Experimentos:

- Testar `new Date('2026-03-14')` vs `new Date('2026-03-14T00:00:00')` no Node e ver que fuso ele assume.
- Verificar o que e armazenado/retornado para `@db.Date` em timezones diferentes.

## 6) Multi-Tenancy e Escopo de Autorizacao

Agendamentos sao multi-tenant por `companyId`. Toda leitura/escrita deve ser escopada.

Estude:

- Como outros modulos reforcam o escopo por empresa (`@CurrentUser()` inclui `companyId`)
- Padroes de guards/roles no controller de `schedule` (`JwtAuthGuard`, `RolesGuard`, `@Roles(...)`)
- Quais endpoints sao publicos vs autenticados (e riscos de vazamento de dados)

Checklist para endpoints de appointment:

- `create`: precisa validar que employee/service/customer pertencem a mesma empresa do token.
- `findAll/findOne/update/remove`: precisa incluir `companyId` no `where`, nao apenas `id`.

## 7) Transicoes de Status como Maquina de Estados

Transforme updates de status em regras explicitas:

- Transicoes permitidas
- Quem pode executar
- Efeitos colaterais (notificacoes, reembolsos, logs de auditoria)
- Concorrencia: dois atores atualizando status ao mesmo tempo

Estude:

- Updates "compare-and-set" (`updateMany` com `where: { id, status: SCHEDULED }`)
- Transicoes idempotentes (chamar cancel duas vezes)

## 8) Tratamento de Erros e Mapeamento de Conflitos

O repo ja mapeia alguns erros do Prisma em um filter global:

- `P2002` unique constraint -> HTTP 409
- `P2003` foreign key -> HTTP 400

Para appointment voce provavelmente tambem vai querer:

- Not found (`P2025`) -> 404
- Sua constraint customizada de "sobreposicao" -> 409 com uma mensagem clara

## 9) Testes de Corretude

Os melhores testes aqui sao de *propriedades*, nao so exemplos pontuais.

Ideias:

- Testes unitarios para checagem de sobreposicao de intervalos (incluindo bordas: encostar endpoints, dia com DST, cancelamento).
- Teste de concorrencia: disparar `Promise.all([...createAppointment])` duas vezes para o mesmo slot e garantir que so um passa.
- Teste de integracao em cima da estrategia de constraint/locking escolhida.

## 10) Performance e Design de Queries

O calculo de disponibilidade pode ficar caro:

- A geracao de slots escala com quantidade de blocos e com o tamanho do passo.
- A busca de appointments precisa de bons indices (`employeeId`, `appointmentDate`, `status`).

Estude:

- Formas de query e indices no Postgres
- Evitar N+1 com `include`
- Cache de slots disponiveis (e por que cache e dificil sem um mecanismo forte de conflito)
