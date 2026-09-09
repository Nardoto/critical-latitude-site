# Ocorrências e limites da coleta

- Os 14 motores terminaram com sucesso. Foram coletadas 14 transcrições completas, 14 descrições completas e 14 documentos públicos de fontes. Não houve erro 429 nem repetição externa de um comando de vídeo.
- O JSON do motor corta descrições em 2.000 caracteres. A coleta adicional com o yt-dlp do Studio recuperou a descrição integral e os capítulos; `dados.json` permanece idêntico ao original do motor.
- Apenas Cascadia (`kNxPtIbUd8o`) expôs heatmap, com 100 pontos. Os outros 13 não forneceram esses dados. Heatmap de trechos mais revistos não é a curva privada de retenção do YouTube Analytics.
- O yt-dlp emitiu aviso de ausência de runtime JavaScript em todos os suplementos. No primeiro vídeo também avisou que os dados iniciais estavam incompletos e fez sua recuperação interna. Todos os suplementos terminaram com exit code 0, legendas e metadados salvos. Os stderr foram preservados.
- A primeira versão da identificação de links de Sources incluiu três URLs comerciais adjacentes e não reconheceu três cabeçalhos alternativos. A seleção foi corrigida; os 14 documentos corretos foram baixados. As URLs comerciais permanecem em `descricao.md`, e não são fontes inacessíveis.
- O lote usou dois workers e agendamentos espaçados em 5 segundos, além do primeiro vídeo iniciado manualmente. A fila permitiu alguns inícios de vídeos separados por menos de 5 segundos. O script foi corrigido para aplicar a pausa no início efetivo de cada vídeo; o lote não foi repetido para evitar requisições desnecessárias. Esse desvio da pausa solicitada fica registrado aqui.
- Os textos das legendas automáticas foram preservados, inclusive erros de reconhecimento. A conversão remove repetições das janelas móveis do VTT, sem reescrever o conteúdo. Texto integral e primeiro/último timestamp são comparados ao JSON3 do motor.
- As perguntas do índice são uma síntese qualitativa com referências aos comentários. Não houve contagem exaustiva de todos os agrupamentos para produzir um ranking estatístico das duas perguntas mais frequentes. Em seis vídeos não foi possível demonstrar uma segunda pergunta recorrente; foi registrada uma pergunta isolada. Opiniões, alegações de IA e relatos dos comentários não são tratados como fatos verificados.
- O adaptador `.codex/skills/nardoto-workspace-production/SKILL.md` citado pelo AGENTS.md do workspace não foi localizado. A skill solicitada `pesquisa-mercado`, instalada no Studio, foi lida e executada.

Não foram escritos artigos nem alterados arquivos do site.
