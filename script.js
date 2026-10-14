const campoPergunta = document.getElementById("campo-pergunta");
const btnEnviar = document.getElementById("btn-enviar");
const caixaResultados = document.querySelector(".caixa-resultados");
const textoResultado = document.querySelector(".texto-resultados");
const btnVoz = document.getElementById("btn-voz");
const linkNoticia = document.getElementById("link-noticia");
const listaSugestoes = document.getElementById("lista-sugestoes");
const statusCarregando = document.getElementById("carregando");

let textoAtualVoz = "";

const sugestoes = [
    "Gengivite",
    "Cárie dentária",
    "Aparelho ortodôntico",
    "Tratamento de canal",
    "Siso"
];

function carregarSugestoes() {
    listaSugestoes.innerHTML = "";
    sugestoes.forEach(sugestao => {
        const btn = document.createElement("button");
        btn.classList.add("btn-sugestao");
        btn.textContent = sugestao;
        btn.addEventListener("click", () => {
            campoPergunta.value = sugestao;
            pesquisarNoDuckDuckGo(sugestao);
        });
        listaSugestoes.appendChild(btn);
    });
}

// Integração direta com o DuckDuckGo via JSONP (Contorna CORS e renderiza na página)
function pesquisarNoDuckDuckGo(termo) {
    if (!termo.trim()) {
        alert("Digite uma pergunta para pesquisar.");
        return;
    }

    pararVoz();
    caixaResultados.classList.remove("mostrar");
    statusCarregando.style.display = "flex";

    // Cria um script dinâmico para carregar o callback do DuckDuckGo
    const scriptAntigo = document.getElementById("ddg-script");
    if (scriptAntigo) scriptAntigo.remove();

    const termoBusca = encodeURIComponent(termo + " odontologia");
    const script = document.createElement("script");
    script.id = "ddg-script";
    script.src = `https://api.duckduckgo.com/?q=${termoBusca}&format=json&callback=processarRespostaDDG&kl=br-pt`;

    document.body.appendChild(script);
}

// Callback chamado automaticamente pelo DuckDuckGo
window.processarRespostaDDG = function(dados) {
    statusCarregando.style.display = "none";

    let respostaTexto = "";
    let fonteUrl = "";

    if (dados.AbstractText) {
        respostaTexto = dados.AbstractText;
        fonteUrl = dados.AbstractURL || dados.Url;
    } else if (dados.RelatedTopics && dados.RelatedTopics.length > 0 && dados.RelatedTopics[0].Text) {
        respostaTexto = dados.RelatedTopics[0].Text;
        fonteUrl = dados.RelatedTopics[0].FirstURL;
    } else {
        // Se o DuckDuckGo não trouxer resumo direto, busca na Wikipédia PT como fallback
        buscarFallbackWiki(campoPergunta.value);
        return;
    }

    exibirResultado(respostaTexto, fonteUrl);
};

// Fallback de busca em Wikipédia PT caso o DuckDuckGo não traga resumo
async function buscarFallbackWiki(termo) {
    try {
        const res = await fetch(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(termo)}`);
        if (res.ok) {
            const data = await res.json();
            if (data.extract) {
                exibirResultado(data.extract, data.content_urls.desktop.page);
                return;
            }
        }
    } catch (e) {
        console.error(e);
    }

    exibirResultado(
        `Resultados pesquisados no DuckDuckGo para "${termo}". Nenhuma resposta direta foi gerada, mas você pode conferir o artigo no link.`,
        `https://duckduckgo.com/?q=${encodeURIComponent(termo + ' odontologia')}`
    );
}

function exibirResultado(texto, url) {
    textoResultado.textContent = texto;
    linkNoticia.href = url || "#";
    textoAtualVoz = texto;

    caixaResultados.classList.add("mostrar");

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Sintetizador de Voz por I.A do Navegador
function falarTexto(texto) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.0;

        utterance.onend = () => {
            btnVoz.classList.remove("falando");
        };

        window.speechSynthesis.speak(utterance);
        btnVoz.classList.add("falando");
    } else {
        alert("O seu navegador não suporta a síntese de voz.");
    }
}

function pararVoz() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        btnVoz.classList.remove("falando");
    }
}

// Eventos
btnEnviar.addEventListener("click", () => {
    pesquisarNoDuckDuckGo(campoPergunta.value);
});

campoPergunta.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        pesquisarNoDuckDuckGo(campoPergunta.value);
    }
});

btnVoz.addEventListener("click", () => {
    if (window.speechSynthesis.speaking) {
        pararVoz();
    } else if (textoAtualVoz) {
        falarTexto(textoAtualVoz);
    }
});

carregarSugestoes();