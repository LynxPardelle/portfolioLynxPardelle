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
  // headerNavReady();
}

function getSTrabajos() {
  document.getElementById("s_trabajos").innerHTML = document.getElementById("section_trabajos_iframe").contentWindow.document.getElementById("s_trabajos").innerHTML;
}

function random(max = 50) {
  return Math.floor(Math.random() * max);
}