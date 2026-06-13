# Gestão de Usuários e Segurança do PortfolioHUB

## 1. Objetivo

Este documento apresenta as práticas de gestão de usuários e segurança adotadas durante a implantação do PortfolioHUB.

O objetivo é demonstrar que o projeto foi publicado de forma organizada, com controle de acesso, cuidado com informações sensíveis e uso adequado do GitHub como ambiente de versionamento e publicação.

## 2. Gestão de Usuários no GitHub

O repositório do PortfolioHUB foi criado e administrado por meio de uma conta GitHub vinculada ao responsável pelo projeto.

A gestão de acesso foi definida de forma simples, considerando que se trata de uma entrega individual. Dessa forma, apenas o proprietário do repositório possui permissão direta para realizar alterações no código-fonte, configurações e documentação.

O acesso público ao repositório permite apenas visualização, clonagem e consulta dos arquivos, sem permissão para alterações diretas na branch principal.

## 3. Controle de Acesso

O controle de acesso foi estruturado da seguinte forma:

* Proprietário do repositório: possui permissão de escrita, configuração e publicação;
* Visitantes externos: possuem permissão apenas de leitura;
* Colaboradores externos: devem sugerir alterações por meio de Pull Requests, caso necessário;
* Branch principal: mantida como versão estável do projeto.

Essa organização reduz o risco de alterações indevidas e mantém maior controle sobre a versão publicada do PortfolioHUB.

## 4. Segurança no Repositório

Durante a implantação, foram adotadas boas práticas básicas de segurança no repositório GitHub.

As principais medidas consideradas foram:

* Não publicar senhas no código-fonte;
* Não armazenar tokens ou chaves de API;
* Não expor dados pessoais sensíveis;
* Revisar arquivos antes de realizar commits;
* Manter apenas informações adequadas para divulgação pública;
* Utilizar commits para rastrear alterações;
* Manter a documentação atualizada;
* Evitar arquivos desnecessários no repositório.

## 5. Segurança no GitHub Pages

O PortfolioHUB foi publicado por meio do GitHub Pages, utilizando arquivos estáticos.

Como o projeto utiliza HTML, CSS e JavaScript puro, não há armazenamento de dados de usuários, autenticação, banco de dados ou processamento de informações sensíveis.

Essa característica reduz riscos relacionados a vazamento de dados, pois o site atua apenas como uma página pública de apresentação profissional.

## 6. Cuidados com Dados Sensíveis

Antes da publicação, os arquivos do projeto foram revisados para evitar exposição de informações sensíveis.

Foram considerados como dados sensíveis:

* Senhas;
* Tokens de acesso;
* Chaves privadas;
* Chaves de API;
* Dados pessoais excessivos;
* Informações internas ou privadas;
* Arquivos de configuração com credenciais.

Nenhum desses itens deve ser mantido no repositório público.

## 7. Política de Alterações

As alterações no PortfolioHUB devem seguir uma organização mínima para preservar a integridade do projeto.

Sempre que houver uma alteração relevante, recomenda-se:

1. Revisar os arquivos modificados;
2. Verificar se não há dados sensíveis;
3. Realizar commit com mensagem clara;
4. Conferir o funcionamento do site após a publicação;
5. Manter a documentação atualizada.

## 8. Uso de Pull Requests

Como o projeto é individual, as alterações podem ser feitas diretamente pelo proprietário.

No entanto, caso exista colaboração futura, recomenda-se o uso de Pull Requests para revisão das mudanças antes da integração com a branch principal.

Essa prática melhora o controle de qualidade e reduz o risco de problemas no site publicado.

## 9. Apoio do Google Gemini na Segurança

O Google Gemini foi utilizado como ferramenta de apoio para revisar boas práticas de segurança aplicáveis a repositórios públicos e sites publicados com GitHub Pages.

A IA contribuiu com orientações sobre:

* Evitar exposição de senhas;
* Evitar publicação de tokens;
* Manter o repositório organizado;
* Criar documentação de segurança;
* Revisar arquivos antes da publicação;
* Controlar alterações por meio do GitHub.

## 10. Conclusão

A implantação do PortfolioHUB seguiu práticas básicas de segurança e controle de acesso adequadas para um projeto individual publicado no GitHub Pages.

O repositório foi organizado de forma pública para apresentação profissional, mantendo cuidado com dados sensíveis, controle de alterações e documentação do processo.

Essas práticas contribuem para uma entrega mais segura, organizada e alinhada às boas práticas de uso do GitHub.
