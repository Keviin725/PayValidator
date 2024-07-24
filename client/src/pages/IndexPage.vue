<template>
  <q-page class="flex flex-center">
    <q-form @submit.prevent="processarImagem">
      <q-uploader v-model="arquivos" label="Upload Talão de Depósito" @uploaded="processarImagem" />
      <q-btn type="submit" label="Validar Pagamento" />
      <q-banner v-if="resultado" type="positive">{{ resultado }}</q-banner>
      <q-banner v-if="erro" type="negative">{{ erro }}</q-banner>
    </q-form>
  </q-page>
</template>

<script setup>
import axios from 'axios';
import { ref } from 'vue';


defineOptions({
  name: 'IndexPage',

  setup() {
    const arquivos = ref([]);
    const resultado = ref('');
    const erro = ref('');

    const processarImagem = async () => {
      const formData = new FormData();
      formData.append('file', arquivos.value[0]);

      try {
        const response = await axios.post('http://localhost:5000/extrair_dados', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        const dadosTalao = response.data;
        validarPagamento(dadosTalao);
      } catch (error) {
        erro.value = 'Erro ao processar a imagem.';
      }
    };

    const validarPagamento = async (dadosTalao) => {
      try {
        const response = await axios.post('http://localhost:5000/validar_pagamento', dadosTalao);
        resultado.value = response.data.message;
        erro.value = '';
      } catch (error) {
        erro.value = error.response.data.message;
        resultado.value = '';
      }
    };

    return {
      arquivos,
      resultado,
      erro,
      processarImagem,
      validarPagamento
    };
  }
});
</script>
