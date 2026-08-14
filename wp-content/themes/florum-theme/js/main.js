document.addEventListener("DOMContentLoaded", () => {
  const COLLAPSED_NAV_MAX = 1199;
  const isCollapsedNavigation = () => window.innerWidth <= COLLAPSED_NAV_MAX;
  const responsiveImageDevice = () => window.innerWidth <= 767
    ? "mobile"
    : (window.innerWidth <= 1199 ? "tablet" : "desktop");
  const responsiveImageUrl = (src, profile = "standard") => {
    if (!src) {
      return src;
    }

    const marker = "/images/";
    const markerIndex = src.indexOf(marker);
    if (markerIndex < 0) {
      return src;
    }

    const relative = decodeURIComponent(src.slice(markerIndex + marker.length).split(/[?#]/)[0])
      .replace(/--(?:desktop|tablet|mobile)--\d+x\d+(?=\.[^.]+$)/, "");
    const deviceCrops = window.florumResponsiveImages?.[relative]?.[responsiveImageDevice()];
    const selectedCrop = typeof deviceCrops === "string"
      ? deviceCrops
      : (deviceCrops?.[profile] || deviceCrops?.standard);
    return selectedCrop ? `${src.slice(0, markerIndex + marker.length)}${selectedCrop}` : src;
  };
  const reveals = document.querySelectorAll(".reveal");
  const fadeCarousels = document.querySelectorAll("[data-fade-carousel]");
  const bookingStrips = document.querySelectorAll(".booking-strip");
  const sliderTracks = document.querySelectorAll("[data-slider]");
  const mobileListAccordions = document.querySelectorAll("[data-mobile-list-accordion]");
  const contactForms = document.querySelectorAll("[data-contact-form]");
  const hospitalityTabs = document.querySelectorAll("[data-hospitality-tabs], .hospitality-tabs");
  const serviceCards = document.querySelectorAll(".service-card, .service-reveal-item");
  const siteHeader = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector(".main-nav");
  const revealPageContent = () => {
    reveals.forEach((item) => item.classList.add("is-visible"));
  };

  // Reveals are progressive enhancement, never a rendering dependency.
  // Schedule them before initializing interactive components so an unrelated
  // runtime error cannot leave the page hidden on its light background.
  window.requestAnimationFrame(revealPageContent);
  window.setTimeout(revealPageContent, 1200);

  const syncAdminBarOffset = () => {
    if (isCollapsedNavigation()) {
      document.documentElement.style.setProperty("--wp-admin-bar-offset", "0px");
      return;
    }

    const adminBar = document.getElementById("wpadminbar");
    const adminBarHeight = adminBar && window.getComputedStyle(adminBar).display !== "none"
      ? Math.ceil(adminBar.getBoundingClientRect().height)
      : 0;

    document.documentElement.style.setProperty("--wp-admin-bar-offset", `${adminBarHeight}px`);
  };
  const runWhenIdle = (callback) => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(callback, { timeout: 1800 });
      return;
    }

    window.setTimeout(callback, 160);
  };

  syncAdminBarOffset();
  window.addEventListener("load", syncAdminBarOffset);
  window.addEventListener("resize", syncAdminBarOffset);

  if (siteHeader && menuToggle && mainNav) {
    const setMenuScrollLock = (locked) => {
      document.documentElement.classList.toggle("is-navigation-open", locked);
      document.body.classList.toggle("is-navigation-open", locked);
    };

    const closeMenu = () => {
      const openLabel = menuToggle.dataset.labelOpen || "Open menu";
      siteHeader.classList.remove("is-menu-open");
      setMenuScrollLock(false);
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", openLabel);
      mainNav.querySelectorAll(".nav-dropdown.is-open").forEach((dropdown) => {
        dropdown.classList.remove("is-open");
        dropdown.querySelectorAll(":scope > .nav-dropdown__trigger").forEach((trigger) => {
          trigger.setAttribute("aria-expanded", "false");
        });
      });
    };

    const openMenu = () => {
      const closeLabel = menuToggle.dataset.labelClose || "Close menu";
      siteHeader.classList.add("is-menu-open");
      setMenuScrollLock(true);
      menuToggle.setAttribute("aria-expanded", "true");
      menuToggle.setAttribute("aria-label", closeLabel);
    };

    menuToggle.addEventListener("click", () => {
      if (siteHeader.classList.contains("is-menu-open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    mainNav.querySelectorAll("a:not(.nav-dropdown__trigger)").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    mainNav.querySelectorAll("[data-booking-toggle]").forEach((button) => {
      button.addEventListener("click", closeMenu);
    });

    window.addEventListener("resize", () => {
      if (!isCollapsedNavigation()) {
        closeMenu();
      }
    });

  }

  const DROPDOWN_CLOSE_DELAY = 600;
  document.querySelectorAll(".nav-dropdown").forEach((dropdown) => {
    const triggers = dropdown.querySelectorAll(":scope > .nav-dropdown__trigger");
    const trigger = triggers[0];
    const getActiveTrigger = () => isCollapsedNavigation()
      ? dropdown.querySelector(":scope > .nav-dropdown__trigger--mobile") || trigger
      : trigger;
    const panel = dropdown.querySelector(":scope > .nav-dropdown__menu");
    const isLanguageDropdown = dropdown.classList.contains("nav-dropdown--language");
    let closeTimer = null;

    const cancelClose = () => {
      if (closeTimer !== null) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
    };

    const setDropdownOpen = (open) => {
      if (open && isCollapsedNavigation()) {
        document.querySelectorAll(".nav-dropdown.is-open").forEach((openDropdown) => {
          if (openDropdown === dropdown) {
            return;
          }

          openDropdown.classList.remove("is-open");
          openDropdown.querySelectorAll(":scope > .nav-dropdown__trigger").forEach((openTrigger) => {
            openTrigger.setAttribute("aria-expanded", "false");
          });
        });
      }

      dropdown.classList.toggle("is-open", open);
      triggers.forEach((dropdownTrigger) => {
        dropdownTrigger.setAttribute("aria-expanded", String(open));
      });
    };

    const openDropdown = () => {
      if (isCollapsedNavigation()) {
        return;
      }

      cancelClose();
      setDropdownOpen(true);
    };

    const closeDropdown = (immediate = false) => {
      cancelClose();

      if (immediate) {
        setDropdownOpen(false);
        return;
      }

      closeTimer = window.setTimeout(() => {
        setDropdownOpen(false);
        closeTimer = null;
      }, DROPDOWN_CLOSE_DELAY);
    };

    dropdown.addEventListener("pointerenter", openDropdown);
    dropdown.addEventListener("pointerleave", () => closeDropdown());
    dropdown.querySelectorAll(":scope > .nav-dropdown__menu a").forEach((link) => {
      link.addEventListener("pointerdown", cancelClose);
    });
    dropdown.addEventListener("focusin", openDropdown);
    dropdown.addEventListener("focusout", (event) => {
      if (!dropdown.contains(event.relatedTarget)) {
        closeDropdown();
      }
    });
    dropdown.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      closeDropdown(true);
      getActiveTrigger()?.focus();
    });

    triggers.forEach((dropdownTrigger) => {
      dropdownTrigger.addEventListener("click", (event) => {
        if (!isLanguageDropdown) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        cancelClose();
        setDropdownOpen(!dropdown.classList.contains("is-open"));
      });
    });

    if (isLanguageDropdown) {
      document.addEventListener("click", (event) => {
        if (!dropdown.contains(event.target)) {
          closeDropdown(true);
        }
      });
    }

    window.addEventListener("resize", () => {
      if (isCollapsedNavigation()) {
        closeDropdown(true);
      }
    });

    window.addEventListener("pagehide", cancelClose, { once: true });
  });

  const roomPreviewModal = document.querySelector("[data-room-preview-modal]");
  const roomPreviewTriggers = document.querySelectorAll("[data-room-preview-trigger]");
  const roomPreviewCards = document.querySelectorAll("[data-room-preview-card]");

  if (roomPreviewModal && roomPreviewTriggers.length > 0) {
    const catalogElement = document.querySelector("[data-room-preview-catalog]");
    const roomCatalog = catalogElement ? JSON.parse(catalogElement.textContent) : {};
    const closeButton = roomPreviewModal.querySelector("[data-room-preview-close]");
    const status = roomPreviewModal.querySelector("[data-room-preview-status]");
    const content = roomPreviewModal.querySelector("[data-room-preview-content]");
    const title = roomPreviewModal.querySelector("[data-room-preview-title]");
    const description = roomPreviewModal.querySelector("[data-room-preview-description]");
    const roomFacts = roomPreviewModal.querySelector("[data-room-preview-room-facts]");
    const highlights = roomPreviewModal.querySelector("[data-room-preview-highlights]");
    const includedAmenities = roomPreviewModal.querySelector("[data-room-preview-included-amenities]");
    const amenitiesToggle = roomPreviewModal.querySelector("[data-room-preview-amenities-toggle]");
    const amenitiesLabel = roomPreviewModal.querySelector("[data-room-preview-amenities-label]");
    const amenitiesPanel = roomPreviewModal.querySelector("[data-room-preview-amenities-panel]");
    const complimentaryToggle = roomPreviewModal.querySelector("[data-room-preview-complimentary-toggle]");
    const complimentaryPanel = roomPreviewModal.querySelector("[data-room-preview-complimentary-panel]");
    const highlightsGroup = highlights?.closest(".room-preview-modal__feature-group");
    const amenitiesGroup = includedAmenities?.closest(".room-preview-modal__feature-group");
    const track = roomPreviewModal.querySelector("[data-room-preview-track]");
    const indicators = roomPreviewModal.querySelector("[data-room-preview-indicators]");
    const previousButton = roomPreviewModal.querySelector("[data-room-preview-previous]");
    const nextButton = roomPreviewModal.querySelector("[data-room-preview-next]");
    const imageLightbox = document.querySelector("[data-room-image-lightbox]");
    const lightboxStage = imageLightbox?.querySelector("[data-room-image-lightbox-stage]");
    const lightboxImage = imageLightbox?.querySelector("[data-room-image-lightbox-image]");
    const lightboxClose = imageLightbox?.querySelector("[data-room-image-lightbox-close]");
    const lightboxPrevious = imageLightbox?.querySelector("[data-room-image-lightbox-previous]");
    const lightboxNext = imageLightbox?.querySelector("[data-room-image-lightbox-next]");
    const lightboxCounter = imageLightbox?.querySelector("[data-room-image-lightbox-counter]");
    const baseUrl = window.location.href;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let activeIndex = 0;
    let activeImages = [];
    let requestId = 0;
    let returnFocus = null;
    let lockedScrollY = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    let lightboxTouchStartX = 0;
    let lightboxTouchStartY = 0;
    let lightboxReturnFocus = null;
    let previewScrollPosition = 0;

    const getPreviewScrollContainer = () => window.matchMedia("(max-width: 767px)").matches
      ? roomPreviewModal.querySelector(".room-preview-modal__shell")
      : roomPreviewModal.querySelector(".room-preview-modal__details");

    const lockPage = () => {
      lockedScrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${lockedScrollY}px`;
      document.body.style.right = "0";
      document.body.style.left = "0";
      document.body.style.width = "100%";
      document.body.classList.add("is-room-preview-open");
    };

    const unlockPage = () => {
      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      document.body.classList.remove("is-room-preview-open");
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.right = "";
      document.body.style.left = "";
      document.body.style.width = "";
      window.scrollTo(0, lockedScrollY);
      window.requestAnimationFrame(() => {
        root.style.scrollBehavior = previousScrollBehavior;
      });
    };

    const renderLightboxImage = () => {
      if (!imageLightbox?.open || activeImages.length === 0) {
        return;
      }

      const image = activeImages[activeIndex];
      // The room preview deliberately stretches some portrait photographs to
      // fill its split panel. The fullscreen viewer must instead render the
      // untouched asset at its natural aspect ratio, so do not carry its
      // responsive/cropped source set into the lightbox.
      lightboxImage.removeAttribute("srcset");
      lightboxImage.removeAttribute("sizes");
      const responsiveSrc = responsiveImageUrl(image.src, window.innerWidth <= 760 ? "standard" : "wide");
      lightboxImage.src = responsiveSrc;
      lightboxImage.alt = image.alt;
      if (lightboxStage) {
        lightboxStage.style.backgroundImage = `url(${JSON.stringify(responsiveSrc)})`;
      }
      lightboxCounter.textContent = `${activeIndex + 1} / ${activeImages.length}`;
      const multipleImages = activeImages.length > 1;
      lightboxPrevious.hidden = !multipleImages;
      lightboxNext.hidden = !multipleImages;
    };

    const showSlide = (index) => {
      if (activeImages.length === 0) {
        return;
      }

      activeIndex = (index + activeImages.length) % activeImages.length;
      track.querySelectorAll(".room-preview-gallery__slide").forEach((slide, slideIndex) => {
        const active = slideIndex === activeIndex;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
        slide.tabIndex = active ? 0 : -1;
      });
      indicators.querySelectorAll("button").forEach((indicator, indicatorIndex) => {
        const active = indicatorIndex === activeIndex;
        indicator.classList.toggle("is-active", active);
        indicator.setAttribute("aria-current", active ? "true" : "false");
      });
      renderLightboxImage();
    };

    const closeImageLightbox = () => {
      if (!imageLightbox?.open) {
        return;
      }

      imageLightbox.classList.remove("is-open");
      const close = () => {
        imageLightbox.close();
        const previewScroller = getPreviewScrollContainer();
        if (previewScroller) {
          previewScroller.scrollTop = previewScrollPosition;
        }
        const focusTarget = track.querySelector(".room-preview-gallery__slide.is-active") || lightboxReturnFocus;
        focusTarget?.focus({ preventScroll: true });
      };

      if (prefersReducedMotion.matches) {
        close();
      } else {
        window.setTimeout(close, 180);
      }
    };

    const openImageLightbox = (trigger) => {
      if (!imageLightbox || activeImages.length === 0 || imageLightbox.open) {
        return;
      }

      lightboxReturnFocus = trigger;
      previewScrollPosition = getPreviewScrollContainer()?.scrollTop || 0;
      imageLightbox.showModal();
      renderLightboxImage();
      window.requestAnimationFrame(() => imageLightbox.classList.add("is-open"));
      lightboxClose.focus({ preventScroll: true });
    };

    const renderRoomFacts = (items) => {
      roomFacts.replaceChildren(...items.map((fact) => {
        const wrapper = document.createElement("div");
        const label = document.createElement("dt");
        const value = document.createElement("dd");
        label.textContent = fact.label;
        value.textContent = fact.value;
        wrapper.append(label, value);
        return wrapper;
      }));
    };

    const renderCheckList = (list, items) => {
      list.replaceChildren(...items.map((text) => {
        const item = document.createElement("li");
        item.textContent = text;
        return item;
      }));
    };

    const renderAmenityGroups = (container, groups) => {
      container.replaceChildren(...groups.map((group) => {
        const section = document.createElement("section");
        const heading = document.createElement("h4");
        const list = document.createElement("ul");
        section.className = "room-preview-modal__amenity-group";
        heading.textContent = group.title;
        list.className = "room-preview-modal__check-list";
        renderCheckList(list, group.items);
        section.append(heading, list);
        return section;
      }));
    };

    const getPreviewData = (trigger, roomKey) => {
      const card = trigger?.closest(".rooms-overview-card");
      return {
        key: card?.dataset.roomKey || roomKey,
        title: card?.dataset.roomTitle || "",
        size: card?.dataset.roomSize || "",
        capacity: card?.dataset.roomCapacity || "",
        description: card?.dataset.roomDescription || "",
      };
    };

    const renderRoom = (room, preview) => {
      roomPreviewModal.classList.remove("is-loading");
      title.textContent = preview.title || room.title;
      description.textContent = preview.description || room.description;
      renderRoomFacts(room.facts);
      renderCheckList(highlights, room.highlights);
      renderAmenityGroups(includedAmenities, room.amenityGroups || []);
      highlightsGroup.hidden = room.highlights.length === 0;
      amenitiesGroup.hidden = (room.amenityGroups || []).length === 0;
      amenitiesPanel.hidden = true;
      amenitiesToggle.hidden = (room.amenityGroups || []).length === 0;
      amenitiesToggle.setAttribute("aria-expanded", "false");
      amenitiesLabel.textContent = amenitiesToggle.dataset.labelOpen;
      complimentaryToggle?.setAttribute("aria-expanded", "false");
      if (complimentaryPanel) {
        complimentaryPanel.hidden = true;
      }

      activeImages = room.images;
      track.replaceChildren(...room.images.map((image, index) => {
        const figure = document.createElement("figure");
        const photo = document.createElement("img");
        figure.className = "room-preview-gallery__slide";
        figure.tabIndex = 0;
        figure.setAttribute("role", "button");
        figure.setAttribute("aria-label", imageLightbox?.dataset.openLabel || "Open image in fullscreen");
        const responsiveSrc = responsiveImageUrl(image.src, window.innerWidth <= 760 ? "standard" : "wide");
        photo.src = responsiveSrc;
        figure.classList.add("room-preview-gallery__slide--contained");
        figure.style.backgroundImage = `url(${JSON.stringify(responsiveSrc)})`;
        photo.style.position = "absolute";
        photo.style.top = "50%";
        photo.style.left = "0";
        photo.style.width = "100%";
        photo.style.height = "100%";
        photo.style.maxHeight = "none";
        photo.style.objectFit = "contain";
        photo.style.objectPosition = "center";
        photo.style.transform = "translateY(-50%)";
        if (image.srcset) {
          photo.srcset = image.srcset;
        }
        photo.alt = image.alt;
        photo.loading = index === 0 ? "eager" : "lazy";
        photo.decoding = "async";
        figure.append(photo);
        return figure;
      }));
      indicators.replaceChildren(...room.images.map((image, index) => {
        const indicator = document.createElement("button");
        indicator.type = "button";
        indicator.setAttribute("aria-label", `${preview.title || room.title}: ${index + 1} / ${room.images.length}`);
        indicator.addEventListener("click", () => showSlide(index));
        return indicator;
      }));
      const multipleImages = room.images.length > 1;
      previousButton.hidden = !multipleImages;
      nextButton.hidden = !multipleImages;
      indicators.hidden = !multipleImages;
      showSlide(0);
      status.hidden = true;
      content.hidden = false;
    };

    const renderImmediatePreview = (trigger, roomKey) => {
      const card = trigger?.closest(".rooms-overview-card");
      const cardImage = card?.querySelector(".rooms-overview-card__media img");
      const preview = getPreviewData(trigger, roomKey);

      roomPreviewModal.classList.add("is-loading");
      title.textContent = preview.title;
      description.textContent = preview.description;
      roomFacts.replaceChildren();
      highlights.replaceChildren();
      includedAmenities.replaceChildren();
      highlightsGroup.hidden = true;
      amenitiesGroup.hidden = true;
      amenitiesPanel.hidden = true;
      amenitiesToggle.hidden = true;
      complimentaryToggle?.setAttribute("aria-expanded", "false");
      if (complimentaryPanel) {
        complimentaryPanel.hidden = true;
      }
      activeImages = cardImage ? [{
        src: cardImage.currentSrc || cardImage.src,
        srcset: cardImage.srcset || "",
        alt: cardImage.alt || preview.title,
      }] : [];
      track.replaceChildren(...activeImages.map((image) => {
        const figure = document.createElement("figure");
        const photo = document.createElement("img");
        figure.className = "room-preview-gallery__slide room-preview-gallery__slide--contained is-active";
        figure.setAttribute("aria-hidden", "false");
        figure.tabIndex = 0;
        figure.setAttribute("role", "button");
        figure.setAttribute("aria-label", imageLightbox?.dataset.openLabel || "Open image in fullscreen");
        const responsiveSrc = responsiveImageUrl(image.src, window.innerWidth <= 760 ? "standard" : "wide");
        figure.style.backgroundImage = `url(${JSON.stringify(responsiveSrc)})`;
        photo.src = responsiveSrc;
        if (image.srcset) {
          photo.srcset = image.srcset;
        }
        photo.alt = image.alt;
        photo.loading = "eager";
        photo.decoding = "async";
        photo.style.position = "absolute";
        photo.style.top = "50%";
        photo.style.left = "0";
        photo.style.width = "100%";
        photo.style.height = "100%";
        photo.style.maxHeight = "none";
        photo.style.objectFit = "contain";
        photo.style.objectPosition = "center";
        photo.style.transform = "translateY(-50%)";
        figure.append(photo);
        return figure;
      }));
      indicators.replaceChildren();
      indicators.hidden = true;
      previousButton.hidden = true;
      nextButton.hidden = true;
      content.hidden = false;
      return preview;
    };

    const finishClose = () => {
      if (!roomPreviewModal.open) {
        return;
      }

      requestId += 1;
      roomPreviewModal.classList.remove("is-open");
      const close = () => {
        roomPreviewModal.close();
        unlockPage();
        returnFocus?.focus({ preventScroll: true });
      };

      if (prefersReducedMotion.matches) {
        close();
      } else {
        window.setTimeout(close, 260);
      }
    };

    const requestClose = () => {
      if (window.history.state?.florumRoomPreview) {
        const nextState = { ...window.history.state };
        delete nextState.florumRoomPreview;
        delete nextState.roomKey;

        const cleanUrl = new URL(window.location.href);
        cleanUrl.hash = "";
        window.history.replaceState(nextState, "", cleanUrl.href);
      }

      finishClose();
    };

    const openPreview = (roomKey, trigger = null, updateHistory = true) => {
      const room = roomCatalog[roomKey];
      if (!room) {
        return;
      }

      requestId += 1;
      returnFocus = trigger || document.querySelector(`[data-room-key="${CSS.escape(roomKey)}"] [data-room-preview-trigger]`) || returnFocus;

      if (!roomPreviewModal.open) {
        lockPage();
        roomPreviewModal.showModal();
        window.requestAnimationFrame(() => roomPreviewModal.classList.add("is-open"));
      }

      status.hidden = false;
      const preview = renderImmediatePreview(returnFocus, roomKey);
      closeButton?.focus({ preventScroll: true });

      if (updateHistory) {
        window.history.pushState({ florumRoomPreview: true, roomKey }, "", `#room-${roomKey}`);
      }
      renderRoom(room, preview);
    };

    roomPreviewTriggers.forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }
        event.preventDefault();
        const roomKey = trigger.closest(".rooms-overview-card")?.dataset.roomKey;
        openPreview(roomKey, trigger, true);
      });
    });

    roomPreviewCards.forEach((card) => {
      card.addEventListener("click", (event) => {
        if (event.target.closest("a, button, input, select, textarea")) {
          return;
        }

        const roomKey = card.dataset.roomKey;
        const returnTarget = card.querySelector("[data-room-preview-trigger]");
        openPreview(roomKey, returnTarget, true);
      });
    });

    closeButton?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      requestClose();
    });
    previousButton?.addEventListener("click", () => showSlide(activeIndex - 1));
    nextButton?.addEventListener("click", () => showSlide(activeIndex + 1));
    track.addEventListener("click", (event) => {
      const slide = event.target.closest(".room-preview-gallery__slide.is-active");
      if (slide) {
        openImageLightbox(slide);
      }
    });
    track.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && event.target.matches(".room-preview-gallery__slide.is-active")) {
        event.preventDefault();
        openImageLightbox(event.target);
      }
    });
    amenitiesToggle?.addEventListener("click", () => {
      const expanded = amenitiesToggle.getAttribute("aria-expanded") === "true";
      amenitiesToggle.setAttribute("aria-expanded", String(!expanded));
      amenitiesLabel.textContent = expanded
        ? amenitiesToggle.dataset.labelOpen
        : amenitiesToggle.dataset.labelClose;
      amenitiesPanel.hidden = expanded;
    });
    complimentaryToggle?.addEventListener("click", () => {
      const expanded = complimentaryToggle.getAttribute("aria-expanded") === "true";
      complimentaryToggle.setAttribute("aria-expanded", String(!expanded));
      complimentaryPanel.hidden = expanded;
    });

    roomPreviewModal.addEventListener("click", (event) => {
      if (event.target === roomPreviewModal) {
        requestClose();
      }
    });
    roomPreviewModal.addEventListener("cancel", (event) => {
      event.preventDefault();
      requestClose();
    });
    roomPreviewModal.addEventListener("keydown", (event) => {
      if (imageLightbox?.open) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        requestClose();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showSlide(activeIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showSlide(activeIndex + 1);
      } else if (event.key === "Tab") {
        const focusable = Array.from(roomPreviewModal.querySelectorAll("button:not([hidden]), a[href], [tabindex]:not([tabindex='-1'])"))
          .filter((item) => !item.disabled && item.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    });

    lightboxClose?.addEventListener("click", closeImageLightbox);
    lightboxPrevious?.addEventListener("click", () => showSlide(activeIndex - 1));
    lightboxNext?.addEventListener("click", () => showSlide(activeIndex + 1));
    imageLightbox?.addEventListener("click", (event) => {
      if (event.target === imageLightbox || event.target === lightboxStage) {
        event.stopPropagation();
        closeImageLightbox();
      }
    });
    imageLightbox?.addEventListener("cancel", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeImageLightbox();
    });
    imageLightbox?.addEventListener("keydown", (event) => {
      event.stopPropagation();
      if (event.key === "Escape") {
        event.preventDefault();
        closeImageLightbox();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showSlide(activeIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showSlide(activeIndex + 1);
      } else if (event.key === "Tab") {
        const focusable = Array.from(imageLightbox.querySelectorAll("button:not([hidden])"))
          .filter((item) => !item.disabled && item.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    });
    lightboxStage?.addEventListener("touchstart", (event) => {
      lightboxTouchStartX = event.changedTouches[0].clientX;
      lightboxTouchStartY = event.changedTouches[0].clientY;
    }, { passive: true });
    lightboxStage?.addEventListener("touchend", (event) => {
      const deltaX = event.changedTouches[0].clientX - lightboxTouchStartX;
      const deltaY = event.changedTouches[0].clientY - lightboxTouchStartY;
      if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY)) {
        showSlide(activeIndex + (deltaX < 0 ? 1 : -1));
      }
    }, { passive: true });

    track.addEventListener("touchstart", (event) => {
      touchStartX = event.changedTouches[0].clientX;
      touchStartY = event.changedTouches[0].clientY;
    }, { passive: true });
    track.addEventListener("touchend", (event) => {
      const deltaX = event.changedTouches[0].clientX - touchStartX;
      const deltaY = event.changedTouches[0].clientY - touchStartY;
      if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY)) {
        showSlide(activeIndex + (deltaX < 0 ? 1 : -1));
      }
    }, { passive: true });

    window.addEventListener("popstate", (event) => {
      if (event.state?.florumRoomPreview && event.state.roomKey) {
        openPreview(event.state.roomKey, null, false);
      } else {
        finishClose();
      }
    });

    window.addEventListener("pagehide", () => {
      if (roomPreviewModal.open) {
        unlockPage();
      }
    });

    const initialRoomMatch = window.location.hash.match(/^#room-([a-z0-9-]+)$/i);
    const initialRoomKey = initialRoomMatch ? initialRoomMatch[1].toLowerCase() : "";

    if (initialRoomKey && roomCatalog[initialRoomKey]) {
      const cleanBaseUrl = new URL(baseUrl);
      cleanBaseUrl.hash = "";
      window.history.replaceState({ ...window.history.state, florumRoomPreviewBase: true }, "", cleanBaseUrl.href);
      window.history.pushState({ florumRoomPreview: true, roomKey: initialRoomKey }, "", `#room-${initialRoomKey}`);
      openPreview(initialRoomKey, null, false);
    } else {
      window.history.replaceState({ ...window.history.state, florumRoomPreviewBase: true }, "", baseUrl);
    }
  }

  if (serviceCards.length > 0) {
    serviceCards.forEach((card, index) => {
      const requestedDelayIndex = Number.parseInt(card.dataset.serviceDelayIndex || "", 10);
      const delayIndex = Number.isFinite(requestedDelayIndex) ? requestedDelayIndex : index;
      card.style.setProperty("--service-delay", `${Math.min(delayIndex * 70, 210)}ms`);
      card.classList.add("is-service-ready");
    });

    const revealServiceCard = (card) => {
      card.classList.add("is-service-visible");
    };

    if ("IntersectionObserver" in window) {
      const serviceObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          revealServiceCard(entry.target);
          observer.unobserve(entry.target);
        });
      }, { rootMargin: "300px 0px", threshold: 0.01 });

      serviceCards.forEach((card) => serviceObserver.observe(card));
    } else {
      window.requestAnimationFrame(() => {
        serviceCards.forEach(revealServiceCard);
      });
    }
  }

  const initFadeCarousel = (carousel) => {
    const slides = Array.from(carousel.querySelectorAll(".hero-slide, .hospitality-slide, .room-slide"));
    const previousButton = carousel.querySelector("[data-fade-prev]");
    const nextButton = carousel.querySelector("[data-fade-next]");
    const indicators = Array.from(carousel.querySelectorAll("[data-fade-indicators] > *"));
    let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active-slide"));
    const slideImages = slides.map((slide) => slide.querySelector("img"));
    let autoplayTimer = null;
    let touchStartX = 0;
    let touchStartY = 0;

    if (slides.length < 2) {
      return;
    }

    if (activeIndex < 0) {
      activeIndex = 0;
      slides[0].classList.add("is-active-slide");
    }

    slideImages.forEach((image) => {
      if (!image) {
        return;
      }

      if (image.complete && image.naturalWidth > 0) {
        image.dataset.carouselReady = "true";
        return;
      }

      image.addEventListener("load", () => {
        image.dataset.carouselReady = "true";
      }, { once: true });
    });

    const isSlideReady = (index) => {
      const image = slideImages[index];
      return !image || image.dataset.carouselReady === "true" || (image.complete && image.naturalWidth > 0);
    };

    const getNextReadyIndex = (direction = 1) => {
      for (let offset = 1; offset < slides.length; offset += 1) {
        const nextIndex = (activeIndex + (offset * direction) + slides.length) % slides.length;

        if (isSlideReady(nextIndex)) {
          return nextIndex;
        }
      }

      return activeIndex;
    };

    const showSlide = (nextIndex) => {
      if (nextIndex === activeIndex || !isSlideReady(nextIndex)) {
        return;
      }

      slides[activeIndex].classList.remove("is-active-slide");
      indicators[activeIndex]?.classList.remove("is-active");
      activeIndex = nextIndex;
      slides[activeIndex].classList.add("is-active-slide");
      indicators[activeIndex]?.classList.add("is-active");
    };

    const startAutoplay = () => {
      if (autoplayTimer !== null) {
        window.clearInterval(autoplayTimer);
      }

      autoplayTimer = window.setInterval(() => showSlide(getNextReadyIndex(1)), 6200);
    };

    const navigate = (direction) => {
      showSlide(getNextReadyIndex(direction));
      startAutoplay();
    };

    previousButton?.addEventListener("click", () => navigate(-1));
    nextButton?.addEventListener("click", () => navigate(1));

    carousel.addEventListener("touchstart", (event) => {
      touchStartX = event.changedTouches[0].clientX;
      touchStartY = event.changedTouches[0].clientY;
    }, { passive: true });

    carousel.addEventListener("touchend", (event) => {
      const deltaX = event.changedTouches[0].clientX - touchStartX;
      const deltaY = event.changedTouches[0].clientY - touchStartY;

      if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY)) {
        navigate(deltaX > 0 ? -1 : 1);
      }
    }, { passive: true });

    startAutoplay();
  };

  fadeCarousels.forEach((carousel) => {
    if (carousel.closest(".urban-hero")) {
      initFadeCarousel(carousel);
      return;
    }

    runWhenIdle(() => initFadeCarousel(carousel));
  });

  bookingStrips.forEach((strip, stripIndex) => {
    const checkIn = strip.querySelector("[data-check-in]");
    const checkOut = strip.querySelector("[data-check-out]");
    const checkInTrigger = strip.querySelector('[data-date-trigger="check-in"]');
    const checkOutTrigger = strip.querySelector('[data-date-trigger="check-out"]');
    const checkInCalendar = strip.querySelector('[data-date-calendar="check-in"]');
    const checkOutCalendar = strip.querySelector('[data-date-calendar="check-out"]');

    if (!checkIn || !checkOut || !checkInTrigger || !checkOutTrigger || !checkInCalendar || !checkOutCalendar) {
      return;
    }

    const locale = document.documentElement.lang || "en";
    const language = locale.toLowerCase().split("-")[0];
    const isRtl = document.documentElement.dir === "rtl";
    const calendarCopy = {
      en: { previousMonth: "Previous month", nextMonth: "Next month", calendar: "Choose a date" },
      de: { previousMonth: "Vorheriger Monat", nextMonth: "Nächster Monat", calendar: "Datum auswählen" },
      ru: { previousMonth: "Предыдущий месяц", nextMonth: "Следующий месяц", calendar: "Выберите дату" },
      it: { previousMonth: "Mese precedente", nextMonth: "Mese successivo", calendar: "Scegli una data" },
      es: { previousMonth: "Mes anterior", nextMonth: "Mes siguiente", calendar: "Elegir una fecha" },
      he: { previousMonth: "החודש הקודם", nextMonth: "החודש הבא", calendar: "בחירת תאריך" },
    }[language] || { previousMonth: "Previous month", nextMonth: "Next month", calendar: "Choose a date" };
    const monthFormatter = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
    const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    const fullDateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "full" });
    const weekdayStart = new Date(2024, 0, 1);
    const weekdays = Array.from({ length: 7 }, (_, index) => weekdayFormatter.format(new Date(2024, 0, weekdayStart.getDate() + index)));
    const escapeAttribute = (value) => String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const formatDisplayDate = (date) => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };

    const parseDate = (value) => {
      if (!value) {
        return null;
      }

      const [year, month, day] = value.split("-").map(Number);
      return new Date(year, month - 1, day);
    };

    const addDays = (date, days) => {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + days);
      return nextDate;
    };

    const isSameDay = (firstDate, secondDate) => (
      firstDate &&
      secondDate &&
      firstDate.getFullYear() === secondDate.getFullYear() &&
      firstDate.getMonth() === secondDate.getMonth() &&
      firstDate.getDate() === secondDate.getDate()
    );

    const pickers = {
      "check-in": {
        input: checkIn,
        trigger: checkInTrigger,
        field: checkInTrigger.closest(".booking-field--date"),
        calendar: checkInCalendar,
        minDate: startOfToday,
        selectedDate: null,
        activeMonth: new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1),
        emptyLabel: checkInTrigger.textContent.trim(),
      },
      "check-out": {
        input: checkOut,
        trigger: checkOutTrigger,
        field: checkOutTrigger.closest(".booking-field--date"),
        calendar: checkOutCalendar,
        minDate: addDays(startOfToday, 1),
        selectedDate: null,
        activeMonth: new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1),
        emptyLabel: checkOutTrigger.textContent.trim(),
      },
    };

    const positionCalendar = (picker) => {
      const calendar = picker.calendar;

      if (calendar.hidden) {
        return;
      }

      const field = picker.trigger.closest(".booking-field");
      const offsetParent = calendar.offsetParent;

      if (!field || !offsetParent) {
        return;
      }

      const viewportGutter = 16;
      const fieldRect = field.getBoundingClientRect();
      calendar.style.transform = "none";
      const calendarRect = calendar.getBoundingClientRect();
      const calendarWidth = calendarRect.width;
      const idealViewportLeft = fieldRect.left + ((fieldRect.width - calendarWidth) / 2);
      const maximumViewportLeft = Math.max(viewportGutter, window.innerWidth - calendarWidth - viewportGutter);
      const clampedViewportLeft = Math.min(
        Math.max(idealViewportLeft, viewportGutter),
        maximumViewportLeft
      );

      calendar.style.removeProperty("left");
      calendar.style.removeProperty("right");
      calendar.style.removeProperty("inset-inline-start");
      calendar.style.transform = `translateX(${clampedViewportLeft - calendarRect.left}px)`;
    };

    const positionOpenCalendars = () => {
      Object.values(pickers).forEach(positionCalendar);
    };
    let calendarPositionTicking = false;
    const requestCalendarPosition = () => {
      if (calendarPositionTicking) {
        return;
      }

      calendarPositionTicking = true;
      window.requestAnimationFrame(() => {
        positionOpenCalendars();
        calendarPositionTicking = false;
      });
    };

    const closeCalendars = () => {
      Object.values(pickers).forEach((picker) => {
        picker.calendar.hidden = true;
        picker.trigger.setAttribute("aria-expanded", "false");
        picker.field?.setAttribute("aria-expanded", "false");
      });
    };

    const updateTrigger = (picker) => {
      if (!picker.selectedDate) {
        picker.trigger.textContent = picker.emptyLabel;
        picker.trigger.classList.remove("has-value");
        return;
      }

      picker.trigger.textContent = formatDisplayDate(picker.selectedDate);
      picker.trigger.classList.add("has-value");
    };

    const renderCalendar = (key) => {
      const picker = pickers[key];
      const selectedDate = picker.selectedDate;
      const activeMonth = picker.activeMonth;
      const monthStart = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1);
      const leadingDays = (monthStart.getDay() + 6) % 7;
      const firstCellDate = addDays(monthStart, -leadingDays);
      const cells = Array.from({ length: 42 }, (_, index) => addDays(firstCellDate, index));
      const firstEnabledIndex = cells.findIndex((date) => date >= picker.minDate);
      const minimumMonth = new Date(picker.minDate.getFullYear(), picker.minDate.getMonth(), 1);
      const canNavigatePrevious = activeMonth > minimumMonth;
      const calendarId = `booking-calendar-${stripIndex}-${key}`;
      const monthId = `${calendarId}-month`;
      const previousIcon = isRtl ? "&rarr;" : "&larr;";
      const nextIcon = isRtl ? "&larr;" : "&rarr;";

      picker.calendar.innerHTML = `
        <div class="booking-calendar__head">
          <button class="booking-calendar__nav" type="button" data-calendar-prev aria-label="${escapeAttribute(calendarCopy.previousMonth)}"${canNavigatePrevious ? "" : " disabled"}>${previousIcon}</button>
          <div class="booking-calendar__month" id="${monthId}" aria-live="polite">${monthFormatter.format(activeMonth)}</div>
          <button class="booking-calendar__nav" type="button" data-calendar-next aria-label="${escapeAttribute(calendarCopy.nextMonth)}">${nextIcon}</button>
        </div>
        <div class="booking-calendar__grid" role="grid" aria-labelledby="${monthId}">
          ${weekdays.map((day) => `<div class="booking-calendar__weekday" role="columnheader" aria-label="${escapeAttribute(day)}">${day}</div>`).join("")}
          ${cells.map((date, index) => {
            const isMuted = date.getMonth() !== activeMonth.getMonth();
            const isDisabled = date < picker.minDate;
            const isToday = isSameDay(date, startOfToday);
            const isSelected = isSameDay(date, selectedDate);
            const isTabStop = isSelected || (!selectedDate && index === firstEnabledIndex);
            const classes = [
              "booking-calendar__day",
              isMuted ? "is-muted" : "",
              isToday ? "is-today" : "",
              isSelected ? "is-selected" : "",
            ].filter(Boolean).join(" ");

            return `<button class="${classes}" type="button" role="gridcell" tabindex="${isTabStop ? "0" : "-1"}" data-calendar-day="${formatDate(date)}" aria-label="${escapeAttribute(fullDateFormatter.format(date))}" aria-selected="${isSelected}"${isToday ? ' aria-current="date"' : ""}${isDisabled ? " disabled" : ""}>${date.getDate()}</button>`;
          }).join("")}
        </div>
      `;

      picker.calendar.id = calendarId;
      picker.calendar.setAttribute("role", "dialog");
      picker.calendar.setAttribute("aria-modal", "false");
      picker.calendar.setAttribute("aria-labelledby", monthId);
      picker.calendar.setAttribute("aria-label", picker.trigger.getAttribute("aria-label") || calendarCopy.calendar);
      picker.trigger.setAttribute("aria-controls", calendarId);
      picker.field?.setAttribute("aria-controls", calendarId);

      picker.calendar.querySelector("[data-calendar-prev]").addEventListener("click", () => {
        picker.activeMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1);
        renderCalendar(key);
        window.requestAnimationFrame(() => picker.calendar.querySelector("[data-calendar-prev]")?.focus());
      });

      picker.calendar.querySelector("[data-calendar-next]").addEventListener("click", () => {
        picker.activeMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 1);
        renderCalendar(key);
        window.requestAnimationFrame(() => picker.calendar.querySelector("[data-calendar-next]")?.focus());
      });

      const dayButtons = Array.from(picker.calendar.querySelectorAll("[data-calendar-day]"));
      const focusDay = (startIndex, step) => {
        let targetIndex = startIndex;

        while (targetIndex >= 0 && targetIndex < dayButtons.length) {
          if (!dayButtons[targetIndex].disabled) {
            dayButtons.forEach((dayButton) => { dayButton.tabIndex = -1; });
            dayButtons[targetIndex].tabIndex = 0;
            dayButtons[targetIndex].focus();
            return;
          }

          targetIndex += step;
        }
      };

      dayButtons.forEach((button, index) => {
        button.addEventListener("click", () => {
          const nextSelectedDate = parseDate(button.getAttribute("data-calendar-day"));
          picker.selectedDate = nextSelectedDate;
          picker.input.value = formatDate(nextSelectedDate);
          updateTrigger(picker);

          if (key === "check-in") {
            const nextCheckoutDate = addDays(nextSelectedDate, 1);
            pickers["check-out"].minDate = nextCheckoutDate;

            if (!pickers["check-out"].selectedDate || pickers["check-out"].selectedDate <= nextSelectedDate) {
              pickers["check-out"].selectedDate = nextCheckoutDate;
              pickers["check-out"].input.value = formatDate(nextCheckoutDate);
              pickers["check-out"].activeMonth = new Date(nextCheckoutDate.getFullYear(), nextCheckoutDate.getMonth(), 1);
              updateTrigger(pickers["check-out"]);
            }

            renderCalendar("check-out");
          }

          closeCalendars();
          picker.field?.focus();
        });

        button.addEventListener("keydown", (event) => {
          const horizontalPrevious = isRtl ? 1 : -1;
          const horizontalNext = isRtl ? -1 : 1;
          const movement = {
            ArrowLeft: horizontalPrevious,
            ArrowRight: horizontalNext,
            ArrowUp: -7,
            ArrowDown: 7,
            Home: -(index % 7),
            End: 6 - (index % 7),
          }[event.key];

          if (typeof movement === "number") {
            event.preventDefault();
            focusDay(index + movement, movement < 0 ? -1 : 1);
            return;
          }

          if (event.key === "PageUp" || event.key === "PageDown") {
            event.preventDefault();
            const direction = event.key === "PageUp" ? -1 : 1;

            if (direction < 0 && !canNavigatePrevious) {
              return;
            }

            picker.activeMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + direction, 1);
            renderCalendar(key);
            window.requestAnimationFrame(() => picker.calendar.querySelector('[data-calendar-day][tabindex="0"]')?.focus());
          }
        });
      });
    };

    Object.entries(pickers).forEach(([key, picker]) => {
      if (!picker.field) {
        return;
      }

      const fieldLabel = picker.trigger.getAttribute("aria-label") || calendarCopy.calendar;
      picker.field.setAttribute("role", "button");
      picker.field.setAttribute("tabindex", "0");
      picker.field.setAttribute("aria-label", fieldLabel);
      picker.field.setAttribute("aria-haspopup", "dialog");
      picker.field.setAttribute("aria-expanded", "false");
      picker.trigger.setAttribute("aria-haspopup", "dialog");
      picker.trigger.setAttribute("aria-expanded", "false");
      picker.trigger.setAttribute("tabindex", "-1");
      picker.trigger.setAttribute("aria-hidden", "true");
      renderCalendar(key);

      picker.trigger.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const wasHidden = picker.calendar.hidden;
        closeCalendars();
        picker.calendar.hidden = !wasHidden;
        picker.trigger.setAttribute("aria-expanded", String(wasHidden));
        picker.field.setAttribute("aria-expanded", String(wasHidden));

        if (wasHidden) {
          window.requestAnimationFrame(() => {
            positionCalendar(picker);
            picker.calendar.querySelector('[data-calendar-day][tabindex="0"]')?.focus();
          });
        }
      });

      picker.field.addEventListener("click", (event) => {
        if (picker.calendar.contains(event.target) || event.target === picker.trigger) {
          return;
        }

        picker.trigger.click();
      });

      picker.field.addEventListener("keydown", (event) => {
        if (event.target !== picker.field || (event.key !== "Enter" && event.key !== " ")) {
          return;
        }

        event.preventDefault();
        picker.trigger.click();
      });
    });

    window.addEventListener("resize", requestCalendarPosition);
    window.addEventListener("scroll", requestCalendarPosition, { passive: true });

    document.addEventListener("click", (event) => {
      if (!strip.contains(event.target)) {
        closeCalendars();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        const openPicker = Object.values(pickers).find((picker) => !picker.calendar.hidden);
        closeCalendars();
        openPicker?.field?.focus();
      }
    });
  });

  const initSliders = () => {
  sliderTracks.forEach((track) => {
    const id = track.getAttribute("data-slider");
    const prevButton = document.querySelector(`[data-slider-prev="${id}"]`);
    const nextButton = document.querySelector(`[data-slider-next="${id}"]`);
    const activeMeta = document.querySelector(`[data-slider-active-meta="${id}"]`);
    const currentPosition = document.querySelector(`[data-slider-current="${id}"]`);
    const totalPosition = document.querySelector(`[data-slider-total="${id}"]`);
    const sliderDots = Array.from(document.querySelectorAll(`[data-slider-dot="${id}"]`));
    const autoPlay = track.hasAttribute("data-slider-autoplay");
    const isRoomSlider = track.classList.contains("room-slider");
    let autoPlayTimer = null;
    let roomImageTimer = null;
    let roomImageSwapTimer = null;
    let activeRoomImageIndex = 0;
    let activeSlideIndex = -1;
    let roomActiveIndex = 0;
    let suppressRoomLinkClick = false;
    let roomTouchStartX = 0;
    let roomTouchStartY = 0;
    let isAdjustingLoop = false;
    const originalSlides = Array.from(track.querySelectorAll(".slider-slide"));
    const preferredCloneCount = isRoomSlider ? 0 : 2;
    const loopCloneCount = Math.min(preferredCloneCount, originalSlides.length);

    if (!prevButton || !nextButton) {
      if (!autoPlay) {
        return;
      }
    }

    if (loopCloneCount > 0) {
      const prependClones = originalSlides.slice(-loopCloneCount).map((slide) => {
        const clone = slide.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        return clone;
      });

      const appendClones = originalSlides.slice(0, loopCloneCount).map((slide) => {
        const clone = slide.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        return clone;
      });

      prependClones.forEach((clone) => {
        track.insertBefore(clone, track.firstChild);
      });

      appendClones.forEach((clone) => {
        track.appendChild(clone);
      });
    }

    const getStep = () => {
      const firstSlide = track.querySelector(".slider-slide");

      if (!firstSlide) {
        return track.clientWidth * 0.8;
      }

      const styles = window.getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap || "0");
      return firstSlide.getBoundingClientRect().width + gap;
    };

    const scheduleLoopCheck = () => {
      window.setTimeout(handleLoopBounds, 380);
    };

    const jumpToOriginalStart = () => {
      track.scrollLeft = getStep() * loopCloneCount;
    };

    const getNormalizedIndex = () => {
      if (originalSlides.length === 0) {
        return 0;
      }

      const step = getStep();
      const adjustedIndex = Math.round(track.scrollLeft / step) - loopCloneCount;
      return ((adjustedIndex % originalSlides.length) + originalSlides.length) % originalSlides.length;
    };

    const scrollToSlide = (index, behavior = "smooth") => {
      if (originalSlides.length === 0) {
        return 0;
      }

      const normalizedIndex = isRoomSlider
        ? Math.max(0, Math.min(index, originalSlides.length - 1))
        : ((index % originalSlides.length) + originalSlides.length) % originalSlides.length;

      track.scrollTo({
        left: getStep() * (loopCloneCount + normalizedIndex),
        behavior,
      });

      return normalizedIndex;
    };

    const getRoomImages = (slide) => {
      if (!slide || !slide.dataset.roomImages) {
        return [];
      }

      try {
        const images = JSON.parse(slide.dataset.roomImages);
        return Array.isArray(images) ? images.filter(Boolean) : [];
      } catch (error) {
        return [];
      }
    };

    const clearRoomImageSwap = () => {
      if (roomImageSwapTimer) {
        window.clearTimeout(roomImageSwapTimer);
        roomImageSwapTimer = null;
      }
    };

    const preloadImage = (src) => new Promise((resolve) => {
      const preloader = new Image();

      preloader.onload = () => resolve(true);
      preloader.onerror = () => resolve(false);
      preloader.src = src;
    });

    const syncRoomImageBackdrop = (slide, src) => {
      const media = slide?.querySelector(".room-card__image");

      if (!media || !src || !document.querySelector("main.home-page")) {
        return;
      }

      media.style.setProperty("--room-image-backdrop", `url(${JSON.stringify(src)})`);
    };

    if (isRoomSlider) {
      originalSlides.forEach((slide) => {
        const image = slide.querySelector(".room-card__photo");
        if (!image) return;

        const syncInitialBackdrop = () => syncRoomImageBackdrop(slide, image.currentSrc || image.src);
        if (image.complete) {
          syncInitialBackdrop();
        } else {
          image.addEventListener("load", syncInitialBackdrop, { once: true });
        }
      });
    }

    const finishRoomImageSwap = (slide) => {
      window.requestAnimationFrame(() => {
        slide.classList.remove("is-switching-image");
      });
    };

    const setRoomImage = (slide, imageIndex, options = {}) => {
      const image = slide ? slide.querySelector(".room-card__photo") : null;
      const images = getRoomImages(slide);

      if (!image || images.length === 0) {
        return;
      }

      const normalizedImageIndex = ((imageIndex % images.length) + images.length) % images.length;
      const usesPreparedShowcaseCrop = image.matches(
        ".room-card__photo--apartments, .room-card__photo--b2b"
      );
      const isHomepageRoomImage = Boolean(image.closest("main.home-page"));
      const nextSrc = responsiveImageUrl(
        images[normalizedImageIndex],
        usesPreparedShowcaseCrop ? "wide" : (isHomepageRoomImage ? "landscape" : "standard")
      );

      if (image.getAttribute("src") === nextSrc) {
        return;
      }

      if (options.instant) {
        clearRoomImageSwap();
        slide.classList.remove("is-switching-image");
        image.setAttribute("src", nextSrc);
        const syncInstantImage = () => syncRoomImageBackdrop(slide, image.currentSrc || nextSrc);
        if (image.complete) {
          syncInstantImage();
        } else {
          image.addEventListener("load", syncInstantImage, { once: true });
        }
        return;
      }

      slide.dataset.roomImageTarget = nextSrc;

      preloadImage(nextSrc).then(() => {
        if (slide.dataset.roomImageTarget !== nextSrc || !slide.classList.contains("is-active")) {
          return;
        }

        clearRoomImageSwap();
        slide.classList.add("is-switching-image");

        roomImageSwapTimer = window.setTimeout(() => {
          if (slide.dataset.roomImageTarget !== nextSrc || !slide.classList.contains("is-active")) {
            slide.classList.remove("is-switching-image");
            return;
          }

          image.setAttribute("src", nextSrc);

          const completeImageSwap = () => {
            syncRoomImageBackdrop(slide, image.currentSrc || nextSrc);
            finishRoomImageSwap(slide);
          };

          if (image.decode) {
            image.decode().catch(() => {}).finally(completeImageSwap);
          } else if (image.complete) {
            completeImageSwap();
          } else {
            image.addEventListener("load", completeImageSwap, { once: true });
          }
        }, 180);
      });
    };

    const stopRoomImageCarousel = () => {
      if (roomImageTimer) {
        window.clearInterval(roomImageTimer);
        roomImageTimer = null;
      }

      clearRoomImageSwap();
    };

    const startRoomImageCarousel = (slide) => {
      const images = getRoomImages(slide);

      stopRoomImageCarousel();

      if (!isRoomSlider || images.length < 2) {
        return;
      }

      roomImageTimer = window.setInterval(() => {
        activeRoomImageIndex = (activeRoomImageIndex + 1) % images.length;
        setRoomImage(slide, activeRoomImageIndex);
      }, 5600);
    };

    const setActiveSlide = (normalizedIndex) => {
      const activeSlide = originalSlides[normalizedIndex];

      if (!activeSlide) {
        return;
      }

      if (isRoomSlider && activeSlideIndex === normalizedIndex) {
        return;
      }

      originalSlides.forEach((slide, index) => {
        const isActive = index === normalizedIndex;
        slide.classList.toggle("is-active-slide", isActive);
        slide.classList.toggle("is-active", isActive);

        if (isRoomSlider) {
          slide.tabIndex = isActive ? 0 : -1;
          slide.setAttribute("aria-hidden", String(!isActive));

          if (isActive) {
            slide.setAttribute("aria-current", "true");
          } else {
            slide.removeAttribute("aria-current");
          }
        }

        if (isRoomSlider && !isActive) {
          setRoomImage(slide, 0, { instant: true });
        }
      });

      if (isRoomSlider) {
        activeSlideIndex = normalizedIndex;
        activeRoomImageIndex = 0;
        setRoomImage(activeSlide, activeRoomImageIndex, { instant: true });
        startRoomImageCarousel(activeSlide);
      }
    };

    const updateActiveMeta = () => {
      if (originalSlides.length === 0) {
        return;
      }

      const normalizedIndex = getNormalizedIndex();
      const activeSlide = originalSlides[normalizedIndex];

      if (isRoomSlider) {
        roomActiveIndex = normalizedIndex;

        if (currentPosition) {
          currentPosition.textContent = String(normalizedIndex + 1).padStart(2, "0");
        }

        if (totalPosition) {
          totalPosition.textContent = String(originalSlides.length).padStart(2, "0");
        }

        if (prevButton) {
          prevButton.disabled = normalizedIndex === 0;
        }

        if (nextButton) {
          nextButton.disabled = normalizedIndex === originalSlides.length - 1;
        }
      }

      setActiveSlide(normalizedIndex);

      if (activeMeta) {
        const guests = activeSlide.getAttribute("data-room-guests");

        if (guests) {
          activeMeta.textContent = guests;
        }
      }

      sliderDots.forEach((dot, index) => {
        const isActive = index === normalizedIndex;
        dot.classList.toggle("is-active", isActive);

        if (isActive) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });
    };

    const handleLoopBounds = () => {
      if (isAdjustingLoop || loopCloneCount === 0) {
        return;
      }

      const step = getStep();
      const originalWidth = step * originalSlides.length;
      const startBoundary = step * (loopCloneCount - 0.5);
      const endBoundary = step * (loopCloneCount + originalSlides.length - 0.5);

      if (track.scrollLeft <= startBoundary) {
        isAdjustingLoop = true;
        track.scrollLeft += originalWidth;
        window.requestAnimationFrame(() => {
          isAdjustingLoop = false;
          updateActiveMeta();
        });
      } else if (track.scrollLeft >= endBoundary) {
        isAdjustingLoop = true;
        track.scrollLeft -= originalWidth;
        window.requestAnimationFrame(() => {
          isAdjustingLoop = false;
          updateActiveMeta();
        });
      }
    };

    const goNext = (behavior = "smooth") => {
      if (isRoomSlider) {
        roomActiveIndex = scrollToSlide(roomActiveIndex + 1, behavior);
        setActiveSlide(roomActiveIndex);
        window.setTimeout(updateActiveMeta, behavior === "smooth" ? 430 : 0);
        return;
      }

      const step = getStep();
      const nearEndThreshold = step * (loopCloneCount + originalSlides.length - 1.6);

      if (track.scrollLeft >= nearEndThreshold) {
        track.scrollBy({ left: step, behavior: "smooth" });
        window.setTimeout(() => {
          track.scrollLeft = step * loopCloneCount;
        }, 420);
        return;
      }

      track.scrollBy({ left: step, behavior: "smooth" });
      scheduleLoopCheck();
    };

    const stopAutoPlay = () => {
      if (autoPlayTimer) {
        window.clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    };

    const startAutoPlay = () => {
      if (!autoPlay || autoPlayTimer) {
        return;
      }

      autoPlayTimer = window.setInterval(goNext, 4200);
    };

    if (prevButton) {
      prevButton.addEventListener("click", (event) => {
        if (isRoomSlider) {
          const behavior = event.detail === 0 ? "auto" : "smooth";
          roomActiveIndex = scrollToSlide(roomActiveIndex - 1, behavior);
          setActiveSlide(roomActiveIndex);
          window.setTimeout(updateActiveMeta, behavior === "smooth" ? 430 : 0);
          return;
        }

        const step = getStep();
        const nearStartThreshold = step * (loopCloneCount - 0.4);

        if (track.scrollLeft <= nearStartThreshold) {
          track.scrollBy({ left: -step, behavior: "smooth" });
          window.setTimeout(() => {
            track.scrollLeft = step * (loopCloneCount + originalSlides.length - 1);
          }, 420);
          return;
        }

        track.scrollBy({ left: -step, behavior: "smooth" });
        scheduleLoopCheck();
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", (event) => {
        goNext(event.detail === 0 ? "auto" : "smooth");
      });
    }

    if (isRoomSlider) {
      track.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
          return;
        }

        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const rtlDirection = document.documentElement.dir === "rtl" ? -direction : direction;
        roomActiveIndex = scrollToSlide(roomActiveIndex + rtlDirection, "auto");
        setActiveSlide(roomActiveIndex);
        updateActiveMeta();
      });

      track.addEventListener("touchstart", (event) => {
        const touch = event.touches[0];

        if (!touch) {
          return;
        }

        roomTouchStartX = touch.clientX;
        roomTouchStartY = touch.clientY;
        suppressRoomLinkClick = false;
      }, { passive: true });

      track.addEventListener("touchmove", (event) => {
        const touch = event.touches[0];

        if (!touch) {
          return;
        }

        if (Math.abs(touch.clientX - roomTouchStartX) > 8 || Math.abs(touch.clientY - roomTouchStartY) > 8) {
          suppressRoomLinkClick = true;
        }
      }, { passive: true });

      track.addEventListener("click", (event) => {
        if (!suppressRoomLinkClick) {
          return;
        }

        event.preventDefault();
        suppressRoomLinkClick = false;
      });
    }

    sliderDots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const targetIndex = Number(dot.getAttribute("data-slider-dot-index"));

        if (Number.isNaN(targetIndex)) {
          return;
        }

        track.scrollTo({
          left: getStep() * (loopCloneCount + targetIndex),
          behavior: "smooth",
        });
        scheduleLoopCheck();
      });
    });

    if (autoPlay) {
      startAutoPlay();

      track.addEventListener("mouseenter", stopAutoPlay);
      track.addEventListener("mouseleave", startAutoPlay);
      track.addEventListener("focusin", stopAutoPlay);
      track.addEventListener("focusout", startAutoPlay);
      track.addEventListener("touchstart", stopAutoPlay, { passive: true });
      track.addEventListener("touchend", startAutoPlay, { passive: true });
    }

    track.addEventListener("scroll", handleLoopBounds, { passive: true });
    track.addEventListener("scroll", updateActiveMeta, { passive: true });

    jumpToOriginalStart();
    updateActiveMeta();
  });
  };

  window.requestAnimationFrame(initSliders);

  hospitalityTabs.forEach((tabGroup) => {
    const triggers = Array.from(tabGroup.querySelectorAll("[data-hospitality-trigger], [data-tab]"));
    const panelsContainer = tabGroup.nextElementSibling;

    if (!panelsContainer) {
      return;
    }

    const panels = Array.from(panelsContainer.querySelectorAll("[data-hospitality-panel], [data-panel]"));
    const currentImage = panelsContainer.querySelector("[data-hospitality-current-image]");
    const getTriggerTarget = (trigger) => trigger.getAttribute("data-hospitality-trigger") || trigger.getAttribute("data-tab");
    const getPanelTarget = (panel) => panel.getAttribute("data-hospitality-panel") || panel.getAttribute("data-panel");

    if (triggers.length === 0 || panels.length === 0) {
      return;
    }

    const setActivePanel = (target) => {
      panels.forEach((panel) => {
        const isActive = getPanelTarget(panel) === target;
        panel.classList.toggle("is-active", isActive);
        panel.hidden = !isActive;
      });

      const activeTrigger = triggers.find((trigger) => getTriggerTarget(trigger) === target);

      if (currentImage && activeTrigger) {
        const nextImageSrc = responsiveImageUrl(activeTrigger.getAttribute("data-hospitality-image-src"));
        const nextImageAlt = activeTrigger.getAttribute("data-hospitality-image-alt");

        if (nextImageSrc && currentImage.getAttribute("src") !== nextImageSrc) {
          currentImage.setAttribute("src", nextImageSrc);
        }

        if (nextImageAlt) {
          currentImage.setAttribute("alt", nextImageAlt);
        }
      }

      triggers.forEach((trigger) => {
        const isActive = getTriggerTarget(trigger) === target;
        trigger.classList.toggle("is-active", isActive);
        trigger.setAttribute("aria-expanded", String(isActive));
        trigger.setAttribute("aria-selected", String(isActive));
      });
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        setActivePanel(getTriggerTarget(trigger));
      });
    });

    const activeTrigger = triggers.find((trigger) => trigger.classList.contains("is-active")) || triggers[0];
    setActivePanel(getTriggerTarget(activeTrigger));
  });

  const initializeMobileAccordion = (accordion, triggerSelector, panelSelector) => {
    const trigger = accordion.querySelector(triggerSelector);
    const panel = accordion.querySelector(panelSelector);
    const mobileQuery = window.matchMedia(
      accordion.dataset.accordionMedia || `(max-width: ${COLLAPSED_NAV_MAX}px)`
    );
    let closeTimer = null;

    if (!trigger || !panel) return;

    const setOpen = (isOpen, animate = true) => {
      window.clearTimeout(closeTimer);
      trigger.setAttribute("aria-expanded", String(isOpen));
      accordion.classList.toggle("is-open", isOpen);

      if (!mobileQuery.matches) {
        panel.hidden = false;
        panel.inert = false;
        panel.removeAttribute("aria-hidden");
        panel.style.maxHeight = "none";
        return;
      }

      panel.inert = !isOpen;
      panel.setAttribute("aria-hidden", String(!isOpen));
      panel.style.transition = animate ? "" : "none";

      if (isOpen) {
        panel.hidden = false;
        panel.style.maxHeight = "0px";
        requestAnimationFrame(() => {
          panel.style.maxHeight = `${panel.scrollHeight}px`;
          panel.style.transition = "";
        });
        return;
      }

      if (!animate) {
        panel.style.maxHeight = "0px";
        panel.hidden = true;
        requestAnimationFrame(() => { panel.style.transition = ""; });
        return;
      }

      panel.style.maxHeight = `${panel.scrollHeight}px`;
      requestAnimationFrame(() => { panel.style.maxHeight = "0px"; });
      closeTimer = window.setTimeout(() => { panel.hidden = true; }, 440);
    };

    trigger.addEventListener("click", () => setOpen(trigger.getAttribute("aria-expanded") !== "true"));
    accordion.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && trigger.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        trigger.focus();
      }
    });
    mobileQuery.addEventListener("change", () => setOpen(false, false));
    window.addEventListener("resize", () => {
      if (!mobileQuery.matches || trigger.getAttribute("aria-expanded") === "true") panel.style.maxHeight = `${panel.scrollHeight}px`;
    });
    setOpen(false, false);
  };

  mobileListAccordions.forEach((accordion) => {
    initializeMobileAccordion(accordion, "[data-mobile-list-trigger]", "[data-mobile-list-panel]");
  });

  contactForms.forEach((form) => {
    const fields = Array.from(form.querySelectorAll("input, select, textarea"));
    const submitButton = form.querySelector("[data-submit-button]");
    const notice = form.querySelector("[data-form-notice]");
    const defaultSubmitLabel = submitButton ? submitButton.textContent : "";
    const messages = {
      required: form.dataset.requiredMessage || "This field is required.",
      email: form.dataset.emailMessage || "Please enter a valid email address.",
      consent: form.dataset.consentMessage || "Please confirm the privacy consent.",
      loading: form.dataset.loadingMessage || "Sending your message…",
      success: form.dataset.successMessage || "Thank you. Your message has been sent and our team will get back to you shortly.",
      error: form.dataset.errorMessage || "We could not send your message. Please try again or contact us by email.",
    };

    const getErrorElement = (field) => {
      const describedBy = field.getAttribute("aria-describedby");
      return describedBy ? document.getElementById(describedBy) : null;
    };

    const clearFieldError = (field) => {
      const errorElement = getErrorElement(field);
      field.removeAttribute("aria-invalid");

      if (errorElement) {
        errorElement.textContent = "";
        errorElement.hidden = true;
      }
    };

    const validateField = (field) => {
      if (!field.required) {
        return true;
      }

      const isConsent = field.type === "checkbox";
      const isEmpty = isConsent ? !field.checked : !field.value.trim();
      const isInvalidEmail = field.type === "email" && !isEmpty && !field.validity.valid;
      const errorElement = getErrorElement(field);

      if (!isEmpty && !isInvalidEmail) {
        clearFieldError(field);
        return true;
      }

      field.setAttribute("aria-invalid", "true");

      if (errorElement) {
        errorElement.textContent = isInvalidEmail ? messages.email : (isConsent ? messages.consent : messages.required);
        errorElement.hidden = false;
      }

      return false;
    };

    fields.forEach((field) => {
      const eventName = field.matches("select, input[type='checkbox']") ? "change" : "input";
      field.addEventListener(eventName, () => clearFieldError(field));
      field.addEventListener("blur", () => validateField(field));
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const invalidFields = fields.filter((field) => !validateField(field));

      if (invalidFields.length > 0) {
        invalidFields[0].focus();
        return;
      }

      if (!submitButton || !notice) {
        return;
      }

      submitButton.disabled = true;
      submitButton.classList.add("is-loading");
      notice.hidden = false;
      notice.dataset.state = "loading";
      notice.textContent = messages.loading;

      // Development-safe placeholder. Replace this timer when plugin-rendered
      // markup handles the real WordPress submission lifecycle.
      window.setTimeout(() => {
        form.reset();
        fields.forEach(clearFieldError);
        submitButton.disabled = false;
        submitButton.classList.remove("is-loading");
        submitButton.textContent = defaultSubmitLabel;
        notice.dataset.state = "success";
        notice.textContent = messages.success;
      }, 450);
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const booking = document.querySelector("[data-header-booking]");
  const toggles = Array.from(document.querySelectorAll("[data-booking-toggle]"));

  if (!booking || toggles.length === 0) {
    return;
  }

  const panel = booking.querySelector(".header-booking__panel");
  const calendar = booking.querySelector("[data-booking-calendar]");
  const daysGrid = booking.querySelector("[data-calendar-days]");
  const weekdaysGrid = booking.querySelector("[data-calendar-weekdays]");
  const calendarHeading = booking.querySelector("[data-calendar-heading]");
  const dateButtons = Array.from(booking.querySelectorAll("[data-date-panel]"));
  const language = (document.documentElement.lang || "en").split("-")[0].toLowerCase();
  const locale = document.documentElement.lang || "en";
  const isMobile = () => window.innerWidth <= 767;
  const todayValue = new Date();
  const today = new Date(todayValue.getFullYear(), todayValue.getMonth(), todayValue.getDate());
  const addDays = (date, amount) => {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
  };
  const toIso = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const sameDay = (first, second) => first && second && toIso(first) === toIso(second);
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
  const shortMonthFormatter = new Intl.DateTimeFormat(locale, { month: "short" });
  const fullDateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "full" });
  const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const weekdayBase = new Date(2026, 7, 2);
  const state = {
    checkIn: today,
    checkOut: addDays(today, 1),
    visibleMonth: new Date(today.getFullYear(), today.getMonth(), 1),
    selecting: "check-in",
    awaitingEnd: false,
    rooms: 1,
    adults: 1,
    children: 0,
  };

  const positionExperience = () => {
    const activeToggle = toggles.find((toggle) => toggle.offsetParent !== null);
    if (!activeToggle || window.innerWidth <= 1199) {
      booking.style.removeProperty("--booking-anchor-right");
      return;
    }

    const toggleRect = activeToggle.getBoundingClientRect();
    const anchoredOffset = Math.max(16, window.innerWidth - toggleRect.right);
    const experienceWidth = booking.querySelector(".header-booking__experience")?.scrollWidth || 0;
    const maximumOffset = Math.max(16, window.innerWidth - experienceWidth - 16);
    const rightOffset = Math.min(anchoredOffset, maximumOffset);
    booking.style.setProperty("--booking-anchor-right", `${rightOffset}px`);
  };

  const setScrollLock = () => {
    document.documentElement.classList.toggle("is-booking-locked", !booking.hidden && isMobile());
  };

  const updateDateSummary = () => {
    const values = [
      ["check-in", state.checkIn],
      ["check-out", state.checkOut],
    ];

    values.forEach(([key, date]) => {
      booking.querySelector(`[data-${key}-day]`).textContent = String(date.getDate()).padStart(2, "0");
      booking.querySelector(`[data-${key}-month]`).textContent = shortMonthFormatter.format(date).replace(".", "").toUpperCase();
    });
  };

  const renderCalendar = () => {
    const monthStart = new Date(state.visibleMonth.getFullYear(), state.visibleMonth.getMonth(), 1);
    const leadingDays = monthStart.getDay();
    const gridStart = addDays(monthStart, -leadingDays);
    calendarHeading.textContent = monthFormatter.format(monthStart).toUpperCase();
    weekdaysGrid.innerHTML = Array.from({ length: 7 }, (_, index) => {
      const label = weekdayFormatter.format(addDays(weekdayBase, index)).replace(".", "").toUpperCase();
      return `<span aria-hidden="true">${label}</span>`;
    }).join("");

    daysGrid.innerHTML = Array.from({ length: 42 }, (_, index) => {
      const date = addDays(gridStart, index);
      const iso = toIso(date);
      const isOutside = date.getMonth() !== monthStart.getMonth();
      const isPast = date < today;
      const isStart = sameDay(date, state.checkIn);
      const isEnd = sameDay(date, state.checkOut);
      const isInRange = date > state.checkIn && date < state.checkOut;
      const classes = [
        "header-booking__day",
        isOutside ? "is-outside" : "",
        isStart ? "is-range-start" : "",
        isEnd ? "is-range-end" : "",
        isInRange ? "is-in-range" : "",
      ].filter(Boolean).join(" ");
      const disabled = isPast || isOutside;

      return `<button type="button" class="${classes}" data-calendar-date="${iso}" role="gridcell" aria-label="${fullDateFormatter.format(date)}" aria-selected="${isStart || isEnd}" aria-disabled="${disabled}"${disabled ? " disabled" : ""}>${date.getDate()}</button>`;
    }).join("");
  };

  const setCalendarOpen = (open, source = null) => {
    if (open) closeGuestMenus();
    calendar.hidden = !open;
    booking.classList.toggle("is-calendar-open", open);
    dateButtons.forEach((button) => button.setAttribute("aria-expanded", String(open && button.dataset.datePanel === state.selecting)));

    if (open) {
      state.selecting = source || state.selecting;
      state.awaitingEnd = false;
      state.visibleMonth = new Date((state.selecting === "check-out" ? state.checkOut : state.checkIn).getFullYear(), (state.selecting === "check-out" ? state.checkOut : state.checkIn).getMonth(), 1);
      renderCalendar();
      window.requestAnimationFrame(() => {
        positionExperience();
        calendar.querySelector("[data-calendar-date]:not(:disabled)")?.focus({ preventScroll: true });
      });
    }
  };

  const closeGuestMenus = (except = null) => {
    booking.querySelectorAll("[data-guest-control]").forEach((control) => {
      if (control === except) return;
      control.querySelector(":scope > button").setAttribute("aria-expanded", "false");
      control.querySelector(".header-booking__guest-menu").hidden = true;
    });
  };

  const setPanelOpen = (open, returnFocus = false) => {
    booking.hidden = !open;
    document.body.classList.toggle("has-header-booking", open);
    toggles.forEach((toggle) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? toggle.dataset.labelClose : toggle.dataset.labelOpen);
      toggle.classList.toggle("is-open", open);
    });
    if (!open) {
      setCalendarOpen(false);
      closeGuestMenus();
      if (returnFocus) toggles.find((toggle) => toggle.offsetParent !== null)?.focus();
    } else {
      positionExperience();
      window.requestAnimationFrame(() => panel?.focus({ preventScroll: true }));
    }
    setScrollLock();
  };

  toggles.forEach((toggle) => toggle.addEventListener("click", () => setPanelOpen(booking.hidden)));
  booking.querySelector("[data-booking-dismiss]").addEventListener("click", () => {
    if (!calendar.hidden) {
      setCalendarOpen(false);
      return;
    }
    setPanelOpen(false);
  });
  booking.querySelector("[data-calendar-close]").addEventListener("click", () => setCalendarOpen(false));
  booking.querySelector("[data-calendar-apply]").addEventListener("click", () => setCalendarOpen(false));

  dateButtons.forEach((button) => button.addEventListener("click", () => {
    const requested = button.dataset.datePanel;
    if (!calendar.hidden && state.selecting === requested) {
      setCalendarOpen(false);
      return;
    }
    state.selecting = requested;
    setCalendarOpen(true, requested);
  }));

  booking.querySelector("[data-calendar-prev]").addEventListener("click", () => {
    const previous = new Date(state.visibleMonth.getFullYear(), state.visibleMonth.getMonth() - 1, 1);
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    if (previous >= currentMonth) state.visibleMonth = previous;
    renderCalendar();
  });
  booking.querySelector("[data-calendar-next]").addEventListener("click", () => {
    state.visibleMonth = new Date(state.visibleMonth.getFullYear(), state.visibleMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  daysGrid.addEventListener("click", (event) => {
    const day = event.target.closest("[data-calendar-date]");
    if (!day || day.disabled) return;
    event.preventDefault();
    event.stopPropagation();
    const [year, month, date] = day.dataset.calendarDate.split("-").map(Number);
    const selected = new Date(year, month - 1, date);

    if (state.selecting === "check-out" && selected > state.checkIn) {
      state.checkOut = selected;
      state.awaitingEnd = false;
      state.selecting = "check-in";
    } else if (!state.awaitingEnd || selected <= state.checkIn) {
      state.checkIn = selected;
      state.checkOut = addDays(selected, 1);
      state.awaitingEnd = true;
      state.selecting = "check-out";
    } else {
      state.checkOut = selected;
      state.awaitingEnd = false;
      state.selecting = "check-in";
    }

    updateDateSummary();
    renderCalendar();
    // Date selection never dismisses the calendar. The first click starts the
    // range and the second completes it; Apply Dates owns dismissal.
    calendar.hidden = false;
    booking.classList.add("is-calendar-open");
    dateButtons.forEach((button) => {
      button.setAttribute("aria-expanded", String(button.dataset.datePanel === state.selecting));
    });
  });

  booking.querySelectorAll("[data-guest-control]").forEach((control) => {
    const trigger = control.querySelector(":scope > button");
    const menu = control.querySelector(".header-booking__guest-menu");
    const key = control.dataset.guestControl;
    trigger.addEventListener("click", () => {
      const opening = menu.hidden;
      if (opening) setCalendarOpen(false);
      closeGuestMenus(opening ? control : null);
      menu.hidden = !opening;
      trigger.setAttribute("aria-expanded", String(opening));
    });
    menu.addEventListener("click", (event) => {
      const option = event.target.closest("[data-guest-option]");
      if (!option) return;
      state[key] = Number(option.dataset.guestOption);
      control.querySelector("[data-guest-value]").textContent = String(state[key]);
      trigger.setAttribute("aria-label", `${control.querySelector(":scope > span").textContent}: ${state[key]}`);
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      trigger.focus();
    });
  });

  booking.querySelector("[data-booking-submit]").addEventListener("click", () => {
    const destination = new URL("https://reservations.hotel-spider.com/02S612795b139dec");
    destination.searchParams.set("checkIn", toIso(state.checkIn));
    destination.searchParams.set("checkOut", toIso(state.checkOut));
    destination.searchParams.set("nbAdults", String(state.adults));
    destination.searchParams.set("nbChildren", String(state.children));
    destination.searchParams.set("lang", ["de", "ru", "it", "es", "he"].includes(language) ? language : "en");
    window.open(destination.toString(), "_blank", "noopener,noreferrer");
  });

  document.addEventListener("click", (event) => {
    if (booking.hidden || event.target.closest("[data-booking-toggle]") || booking.querySelector(".header-booking__experience").contains(event.target)) return;
    if (!calendar.hidden) {
      setCalendarOpen(false);
    } else {
      setPanelOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || booking.hidden) return;
    event.preventDefault();
    if (!calendar.hidden) {
      setCalendarOpen(false);
      dateButtons.find((button) => button.dataset.datePanel === state.selecting)?.focus();
    } else {
      setPanelOpen(false, true);
    }
  });

  window.addEventListener("resize", () => {
    setScrollLock();
    if (!booking.hidden) positionExperience();
  });
  updateDateSummary();
  renderCalendar();
});
