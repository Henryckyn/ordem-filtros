let pickupItems = JSON.parse(localStorage.getItem('docPickupItems')) || [];
let lastCasa = '';
let lastFCU = '';

// Gerenciador do Número Sequencial da Guia
let currentCounter = parseInt(localStorage.getItem('guiaCounter')) || 1;

function getFormattedGuiaCode(num) {
    const paddedNum = String(num).padStart(4, '0');
    return `GR-2026-${paddedNum}`;
}

function updateGuiaDisplay() {
    const code = getFormattedGuiaCode(currentCounter);
    document.getElementById('numGuia').value = code;
    document.getElementById('lblGuia').textContent = code;
}

// Preenche data e hora atual no padrão BR
function updateDateTime() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('lblDataHora').textContent = `${dateStr} às ${timeStr}`;
}

function updateHeaderInfo() {
    document.getElementById('lblAutorizado').textContent = document.getElementById('autorizadoPor').value || '---';
    document.getElementById('lblRetirado').textContent = document.getElementById('retiradoPor').value || '---';
    document.getElementById('lblRegistro').textContent = document.getElementById('numRegistro').value || '---';
    document.getElementById('lblObs').textContent = document.getElementById('obsGeral').value || '---';
}

function repeatLastDest() {
    document.getElementById('itemCasa').value = lastCasa;
    document.getElementById('itemFCU').value = lastFCU;
}

const filterForm = document.getElementById('filterForm');
filterForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const casaVal = document.getElementById('itemCasa').value.trim();
    const fcuVal = document.getElementById('itemFCU').value.trim();
    
    // Guarda o último informado
    lastCasa = casaVal;
    lastFCU = fcuVal;

    let destinoStr = [];
    if (casaVal) destinoStr.push(`Casa: ${casaVal}`);
    if (fcuVal) destinoStr.push(`FCU: ${fcuVal}`);

    const newItem = {
        id: Date.now(),
        codigo: document.getElementById('codigo').value,
        spec: document.getElementById('spec').value,
        medida: document.getElementById('medida').value,
        qtd: parseInt(document.getElementById('qtd').value),
        unidade: document.getElementById('unidade').value,
        destinoText: destinoStr.length > 0 ? destinoStr.join(' / ') : 'Geral / Não Especificado',
        condicao: document.getElementById('condicao').value
    };

    pickupItems.push(newItem);
    saveAndRender();
    
    // Limpa campos para a próxima medida
    document.getElementById('codigo').value = '';
    document.getElementById('spec').value = '';
    document.getElementById('medida').value = '';
    document.getElementById('qtd').value = 1;
    document.getElementById('codigo').focus();
});

function renderTable() {
    const tbody = document.getElementById('itemsBody');
    tbody.innerHTML = '';
    let totalPecas = 0;

    if (pickupItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="center" style="color: #64748b; padding: 15px;">Nenhum filtro cadastrado nesta ordem de retirada.</td></tr>`;
    } else {
        pickupItems.forEach(item => {
            totalPecas += item.qtd;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${item.codigo}</strong></td>
                <td>${item.medida}</td>
                <td>${item.spec}</td>
                <td class="center"><strong>${item.qtd}</strong></td>
                <td class="center">${item.unidade}</td>
                <td><span class="dest-badge">${item.destinoText}</span></td>
                <td>${item.condicao}</td>
                <td class="center no-print">
                    <button class="btn-danger" onclick="removeItem(${item.id})">✕</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    document.getElementById('lblTotalPecas').textContent = totalPecas;
}

function removeItem(id) {
    pickupItems = pickupItems.filter(item => item.id !== id);
    saveAndRender();
}

function clearItems() {
    if(confirm('Deseja limpar todos os itens da ordem de retirada?')) {
        pickupItems = [];
        saveAndRender();
    }
}

function resetCounter() {
    const newNum = prompt('Digite o novo número de início para as guias (ex: 1 para GR-2026-0001):', currentCounter);
    if (newNum !== null && !isNaN(parseInt(newNum))) {
        currentCounter = parseInt(newNum);
        localStorage.setItem('guiaCounter', currentCounter);
        updateGuiaDisplay();
    }
}

function saveAndRender() {
    localStorage.setItem('docPickupItems', JSON.stringify(pickupItems));
    renderTable();
}

// Gerador de PDF Otimizado contra Desalignmento
function generatePDF() {
    updateDateTime();
    updateHeaderInfo();

    const element = document.getElementById('documentArea');
    const noPrintElements = document.querySelectorAll('.no-print');
    
    // Esconde elementos desnecessários para a impressão
    noPrintElements.forEach(el => el.style.display = 'none');

    const currentCode = getFormattedGuiaCode(currentCounter);

    const opt = {
        margin:       [8, 8, 8, 8],
        filename:     `${currentCode}_Retirada_Filtros.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        // Restaura visualização dos botões
        noPrintElements.forEach(el => el.style.display = '');

        currentCounter++;
        localStorage.setItem('guiaCounter', currentCounter);
        updateGuiaDisplay();
    });
}

// Inicialização
updateGuiaDisplay();
renderTable();
updateHeaderInfo();
updateDateTime();
