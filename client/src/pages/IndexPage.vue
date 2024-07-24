<template>
  <q-page class="flex flex-center">
    <q-form @submit.prevent="processarImagem">
      <q-uploader
        v-model="arquivos"
        label="Upload Talão de Depósito"
        url="http://localhost:3000/extrair_dados"
        :headers="headers"
        auto-upload
        @added="onAdded"
        @uploaded="onUploaded"
        @uploading="onUploading"
        @failed="onFailed"
        @error="onError"
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

// Define headers diretamente como um objeto simples
const headers = {
  'Content-Type': 'multipart/form-data'
};

const onAdded = (files) => {
  console.log('Arquivo adicionado:', files);
  uploadCompleto.value = false; // Resetar o status de upload quando um novo arquivo é adicionado
};

const onUploading = (file) => {
  console.log('Arquivo em upload:', file);
};

const onUploaded = (file) => {
  console.log('Arquivo carregado com sucesso:', file);
  uploadCompleto.value = true; // Definir uploadCompleto para true quando o upload for concluído
};

const onFailed = (file) => {
  console.log('Falha no upload do arquivo:', file);
  erro.value = 'Falha ao carregar o arquivo.';
};

const onError = (error) => {
  console.log('Erro no upload:', error);
  erro.value = 'Erro no upload.';
};

const processarImagem = async () => {
  erro.value = '';
  resultado.value = '';

  if (!uploadCompleto.value) {
    erro.value = 'Por favor, complete o upload do arquivo antes de validar.';
    return;
  }

  // Assumindo que o `arquivos.value[0]` está corretamente preenchido
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
