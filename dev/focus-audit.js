import {createApp} from 'vue';
import {createStore} from 'vuex';
import FocusAudit from './FocusAudit.vue';
import tooltip from '../src/directives/Tooltip';
import '../src/styles/login-palettes.scss';
import '../src/styles/portal-layout.scss';
import '../src/styles/focus-cards.scss';

// Public, synthetic fixtures only. Never load a user's saved configuration.
window.fetch=async()=>Response.json({successStatus:true,message:'预览状态，不进行网络检测'});
const store=createStore({state:()=>({editMode:false,currentConfigInfo:{},config:{appConfig:{theme:'material-original'}}}),getters:{
  appConfig:state=>state.config.appConfig,iconSize:()=> 'large',isSubConfig:()=>false,
  permissions:()=>({allowWriteToDisk:false,allowSaveLocally:false,allowViewConfig:false}),
  getParentSectionOfItem:()=>()=>({name:'示例'}),
}});
createApp(FocusAudit).use(store).directive('tooltip',tooltip).directive('click-outside',{}).mount('#app');
