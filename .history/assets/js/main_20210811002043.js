'use strict'

function getBody() {
  document.body.innerHTML =
    `
    <header id="header"></header>

    <main>
      <section id="s_trabajos"></section>
    </main>

    <!-- Recursos -->

    <!-- Contenedores -->
    <iframe id="header_iframe" class="d-none" onload="getHeader()" src="/header.html" frameborder="0"></iframe>

    <iframe id="section_trabajos_iframe" class="d-none" onload="getSTrabajos()" src="/s_trabajos.html" frameborder="0"></iframe>
    ` + document.body.innerHTML;
}
function getHeader() {
  document.getElementById("header").innerHTML = document.getElementById("header_iframe").contentWindow.document.getElementById("header").innerHTML;
  headerNavReady();
}
function getSInfo() {
  document.getElementById("s_info").innerHTML = document.getElementById("section_info_iframe").contentWindow.document.getElementById("s_info").innerHTML;
}
function getSClases() {
  document.getElementById("s_clases").innerHTML = document.getElementById("section_clases_iframe").contentWindow.document.getElementById("s_clases").innerHTML;
/*   console.log(document.getElementById("div_menus").innerHTML); 
  if (document.getElementById("platillo_iframe").contentWindow.document) {
    getPlatillo();
  }
*/
}
function getSUbicacion() {
  document.getElementById("s_ubicacion").innerHTML = document.getElementById("section_ubicacion_iframe").contentWindow.document.getElementById("s_ubicacion").innerHTML;
}

function getSEntrenadores() {
  document.getElementById("s_entrenadores").innerHTML = document.getElementById("section_entrenadores_iframe").contentWindow.document.getElementById("s_entrenadores").innerHTML;
}

function getSMedia() {
  document.getElementById("s_media").innerHTML = document.getElementById("section_media_iframe").contentWindow.document.getElementById("s_media").innerHTML;
}

function getFooter() {
  document.getElementById("footer").innerHTML = document.getElementById("footer_iframe").contentWindow.document.getElementById("footer").innerHTML;
}

function random(max = 50) {
  return Math.floor(Math.random() * max);
}