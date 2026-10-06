<template>
  <button type="button" class="auth-btn" :class="{ 'icon-only': iconOnly }" aria-label="退出登录" title="退出登录" @click="logout">
    <IconLogout /> <span v-if="!iconOnly">退出登录</span>
  </button>
</template>
<script>
import IconLogout from '@/assets/interface-icons/user-logout.svg';
export default {
  name: 'AuthButtons', components: { IconLogout },
  props: { userType: Number, iconOnly: Boolean },
  methods: {
    async logout() {
      try {
        const response = await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
        if (!response.ok) throw new Error('退出失败，请重试');
        window.location.replace('/');
      } catch (e) { this.$toast(e.message); }
    },
  },
};
</script>
<style scoped lang="scss">
.auth-btn{display:inline-flex;align-items:center;gap:.4rem;min-height:32px;padding:.25rem .5rem;background:transparent;color:var(--settings-text-color);border:1px solid currentColor;border-radius:var(--curve-factor);cursor:pointer;svg{width:1.25rem;height:1.25rem;fill:currentColor} &:focus-visible{outline:2px solid currentColor;outline-offset:3px}}
.icon-only{border:0;padding:0;min-width:32px}
</style>
