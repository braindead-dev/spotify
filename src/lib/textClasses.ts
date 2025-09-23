export function getTitleClasses(isLightBg: boolean): string {
  return isLightBg
    ? "text-lg font-semibold text-black"
    : "text-lg font-semibold text-white drop-shadow-sm-dark";
}

export function getArtistLinkClasses(isLightBg: boolean): string {
  return isLightBg
    ? "hover:underline text-black"
    : "hover:underline text-white drop-shadow-sm-dark";
}

export function getAlbumClasses(isLightBg: boolean): string {
  return isLightBg
    ? "text-neutral-600"
    : "text-neutral-200 drop-shadow-xs-dark";
}
