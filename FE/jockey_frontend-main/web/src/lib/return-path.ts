/** Only allow an application-relative destination after authentication. */
export function localReturn(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') && !/[\r\n]/.test(value) ? value : '/';
}
