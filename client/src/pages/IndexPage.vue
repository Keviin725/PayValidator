<template>
  <q-page class="flex flex-center">
    <q-form @submit.prevent="processarImagem">
      <q-uploader
        v-model="arquivos"
        label="Upload Talão de Depósito"
        @input="verificarArquivo"
        @uploaded="uploadCompleto = true"
        auto-upload="true"
      />
      <q-btn @click="processarImagem" label="Validar Pagamento" />
      <q-banner v-if="resultado" type="positive">{{ resultado }}</q-banner>
      <q-banner v-if="erro" type="negative">{{ erro }}</q-banner>
    </q-form>
  </q-page>
</template>


<script setup>
import { ref } from 'vue';
import axios from 'axios';

const arquivos = ref([]);
const resultado = ref('');
const erro = ref('');
const uploadCompleto = ref(false);

const verificarArquivo = () => {
  // Se o arquivo foi selecionado, marque uploadCompleto como true
  if (arquivos.value.length > 0) {
    uploadCompleto.value = true;
  } else {
    uploadCompleto.value = false;
  }
};

const processarImagem = async () => {
  erro.value = '';
  resultado.value = '';

  // Verifica se o upload foi completado antes de prosseguir
  if (!uploadCompleto.value) {
    erro.value = 'Por favor, complete o upload do arquivo antes de validar.';
    return;
  }

  const formData = new FormData();
  formData.append('file', arquivos.value[0]);

  try {
    const response = await axios.post('http://localhost:3000/extrair_dados', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    const dadosTalao = response.data;
    await validarPagamento(dadosTalao);
  } catch (error) {
    erro.value = 'Erro ao processar a imagem.';
  }
};

const validarPagamento = async (dadosTalao) => {
  try {
    const response = await axios.post('http://localhost:5000/validar_pagamento', dadosTalao);
    resultado.value = response.data.message;
  } catch (error) {
    erro.value = error.response.data.message;
  }
};
</script>
