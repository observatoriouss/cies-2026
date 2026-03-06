    const fileInput  = document.getElementById('fileInput');
    const photoRing  = document.getElementById('photoRing');
    const nameInput  = document.getElementById('nameInput');
    const posterName = document.getElementById('posterName');
    const fbBtn      = document.getElementById('fbBtn');
    const fbStatus   = document.getElementById('fb-status');
    const modal      = document.getElementById('modalOverlay');

    let userAccessToken = null;
    let photoDataUrl    = null;

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        photoDataUrl = ev.target.result;
        photoRing.innerHTML = `<img src="${photoDataUrl}" alt="Foto"/>`;
      };
      reader.readAsDataURL(file);
    });

    nameInput.addEventListener('input', () => {
      posterName.textContent = nameInput.value.trim() || 'Tu Nombre Aquí';
    });

    function updateStatus(response) {
      if (response.status === 'connected') {
        userAccessToken = response.authResponse.accessToken;
        fbStatus.textContent = '✅ Conectado con Facebook. Listo para publicar.';
        fbStatus.className = 'logged-in';
      } else {
        userAccessToken = null;
        fbStatus.textContent = 'Conecta con Facebook para publicar';
        fbStatus.className = 'logged-out';
      }
    }

    fbBtn.addEventListener('click', () => {
      if (!photoDataUrl) {
        alert('⚠️ Primero sube tu foto.');
        return;
      }
      if (!userAccessToken) {
        FB.login((response) => {
          if (response.authResponse) {
            updateStatus(response);
            publicar();
          } else {
            fbStatus.textContent = '❌ No se pudo conectar con Facebook.';
            fbStatus.className = 'error';
          }
        }, { scope: 'public_profile,publish_actions' });
      } else {
        publicar();
      }
    });

    function publicar() {
      fbStatus.textContent = '⏳ Publicando...';
      fbStatus.className = 'loading';
      fbBtn.disabled = true;

      const byteString = atob(photoDataUrl.split(',')[1]);
      const mimeType   = photoDataUrl.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: mimeType });

      const formData = new FormData();
      formData.append('source', blob, 'cies-poster.jpg');
      formData.append('message', '🎓 ¡Participaré en la CIES 2026! II Cumbre Iberoamericana de Educación Superior. Del 5 al 7 de mayo en Chiclayo, Perú. #CIES2026 #EducaciónSuperior');
      formData.append('access_token', userAccessToken);

      fetch('https://graph.facebook.com/v19.0/me/photos', {
        method: 'POST',
        body: formData
      })
      .then(r => r.json())
      .then(data => {
        fbBtn.disabled = false;
        if (data.id) {
          fbStatus.textContent = '✅ ¡Publicado exitosamente!';
          fbStatus.className = 'logged-in';
          modal.classList.add('show');
        } else {
          throw new Error(data.error?.message || 'Error desconocido');
        }
      })
      .catch(err => {
        fbBtn.disabled = false;
        fbStatus.textContent = '❌ Error: ' + err.message;
        fbStatus.className = 'error';
        console.error(err);
      });
    }