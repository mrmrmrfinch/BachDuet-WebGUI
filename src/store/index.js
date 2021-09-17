import Vue from 'vue'
import Vuex from 'vuex'
import pianobufferstate from './modules/piano-buffer-state'
import historicalnotes from './modules/historical-notes'
import tickNumber from './modules/tick-number'
// import newmodule from './modules/newmodule'

Vue.use(Vuex);

export default new Vuex.Store({
  state: {

  },
  actions: {

  },
  mutations: {

  },
  getters: {

  },
  modules: {
    pianobufferstate,
    historicalnotes,
    tickNumber
    // add new modules here in this manner:
    // newmodule,
  },
})