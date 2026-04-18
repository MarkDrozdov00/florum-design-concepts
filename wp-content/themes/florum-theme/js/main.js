document.addEventListener("DOMContentLoaded", () => {
  const reveals = document.querySelectorAll(".reveal");
  const fadeCarousels = document.querySelectorAll("[data-fade-carousel]");
  const bookingStrips = document.querySelectorAll(".booking-strip");
  const bookingDrawers = document.querySelectorAll("[data-booking-drawer]");
  const sliderTracks = document.querySelectorAll("[data-slider]");
  const arrivalStacks = document.querySelectorAll("[data-arrival-stack]");
  const hospitalityTabs = document.querySelectorAll("[data-hospitality-tabs], .hospitality-tabs");
  const siteHeader = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector(".main-nav");

  if (siteHeader && menuToggle && mainNav) {
    const closeMenu = () => {
      siteHeader.classList.remove("is-menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open menu");
    };

    const openMenu = () => {
      siteHeader.classList.add("is-menu-open");
      menuToggle.setAttribute("aria-expanded", "true");
      menuToggle.setAttribute("aria-label", "Close menu");
    };

    menuToggle.addEventListener("click", () => {
      if (siteHeader.classList.contains("is-menu-open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) {
        closeMenu();
      }
    });
  }

  bookingDrawers.forEach((drawer) => {
    const toggle = drawer.querySelector("[data-booking-toggle]");
    const drawerId = drawer.getAttribute("id");

    if (!toggle) {
      return;
    }

    const setDrawerOpen = (isOpen) => {
      drawer.classList.toggle("is-open", isOpen);
      drawer.classList.toggle("is-collapsed", !isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Close booking drawer" : "Open booking drawer");
    };

    toggle.addEventListener("click", () => {
      setDrawerOpen(!drawer.classList.contains("is-open"));
    });

    if (drawerId) {
      document.querySelectorAll(`a[href="#${drawerId}"]`).forEach((link) => {
        link.addEventListener("click", () => {
          setDrawerOpen(true);
        });
      });
    }
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    reveals.forEach((item) => observer.observe(item));
  } else {
    reveals.forEach((item) => item.classList.add("is-visible"));
  }

  fadeCarousels.forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll(".hero-slide, .hospitality-slide, .room-card-slide, .room-slide"));
    let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active-slide"));

    if (slides.length < 2) {
      return;
    }

    if (activeIndex < 0) {
      activeIndex = 0;
      slides[0].classList.add("is-active-slide");
    }

    window.setInterval(() => {
      slides[activeIndex].classList.remove("is-active-slide");
      activeIndex = (activeIndex + 1) % slides.length;
      slides[activeIndex].classList.add("is-active-slide");
    }, 4600);
  });

  bookingStrips.forEach((strip) => {
    const checkIn = strip.querySelector("[data-check-in]");
    const checkOut = strip.querySelector("[data-check-out]");
    const checkInTrigger = strip.querySelector('[data-date-trigger="check-in"]');
    const checkOutTrigger = strip.querySelector('[data-date-trigger="check-out"]');
    const checkInCalendar = strip.querySelector('[data-date-calendar="check-in"]');
    const checkOutCalendar = strip.querySelector('[data-date-calendar="check-out"]');

    if (!checkIn || !checkOut || !checkInTrigger || !checkOutTrigger || !checkInCalendar || !checkOutCalendar) {
      return;
    }

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
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
        calendar: checkInCalendar,
        minDate: startOfToday,
        selectedDate: null,
        activeMonth: new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1),
      },
      "check-out": {
        input: checkOut,
        trigger: checkOutTrigger,
        calendar: checkOutCalendar,
        minDate: addDays(startOfToday, 1),
        selectedDate: null,
        activeMonth: new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1),
      },
    };

    const closeCalendars = () => {
      Object.values(pickers).forEach((picker) => {
        picker.calendar.hidden = true;
        picker.trigger.setAttribute("aria-expanded", "false");
      });
    };

    const updateTrigger = (picker) => {
      if (!picker.selectedDate) {
        picker.trigger.textContent = "Select date";
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

      picker.calendar.innerHTML = `
        <div class="booking-calendar__head">
          <button class="booking-calendar__nav" type="button" data-calendar-prev aria-label="Previous month">&larr;</button>
          <div class="booking-calendar__month">${monthNames[activeMonth.getMonth()]} ${activeMonth.getFullYear()}</div>
          <button class="booking-calendar__nav" type="button" data-calendar-next aria-label="Next month">&rarr;</button>
        </div>
        <div class="booking-calendar__grid">
          ${weekdays.map((day) => `<div class="booking-calendar__weekday">${day}</div>`).join("")}
          ${cells.map((date) => {
            const isMuted = date.getMonth() !== activeMonth.getMonth();
            const isDisabled = date < picker.minDate;
            const classes = [
              "booking-calendar__day",
              isMuted ? "is-muted" : "",
              isSameDay(date, startOfToday) ? "is-today" : "",
              isSameDay(date, selectedDate) ? "is-selected" : "",
            ].filter(Boolean).join(" ");

            return `<button class="${classes}" type="button" data-calendar-day="${formatDate(date)}"${isDisabled ? " disabled" : ""}>${date.getDate()}</button>`;
          }).join("")}
        </div>
      `;

      picker.calendar.querySelector("[data-calendar-prev]").addEventListener("click", () => {
        picker.activeMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1);
        renderCalendar(key);
      });

      picker.calendar.querySelector("[data-calendar-next]").addEventListener("click", () => {
        picker.activeMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 1);
        renderCalendar(key);
      });

      picker.calendar.querySelectorAll("[data-calendar-day]").forEach((button) => {
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
        });
      });
    };

    Object.entries(pickers).forEach(([key, picker]) => {
      picker.trigger.setAttribute("aria-haspopup", "dialog");
      picker.trigger.setAttribute("aria-expanded", "false");
      renderCalendar(key);

      picker.trigger.addEventListener("click", () => {
        const wasHidden = picker.calendar.hidden;
        closeCalendars();
        picker.calendar.hidden = !wasHidden;
        picker.trigger.setAttribute("aria-expanded", String(wasHidden));
      });
    });

    document.addEventListener("click", (event) => {
      if (!strip.contains(event.target)) {
        closeCalendars();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeCalendars();
      }
    });
  });

  sliderTracks.forEach((track) => {
    const id = track.getAttribute("data-slider");
    const prevButton = document.querySelector(`[data-slider-prev="${id}"]`);
    const nextButton = document.querySelector(`[data-slider-next="${id}"]`);
    const activeMeta = document.querySelector(`[data-slider-active-meta="${id}"]`);
    const sliderDots = Array.from(document.querySelectorAll(`[data-slider-dot="${id}"]`));
    const autoPlay = track.hasAttribute("data-slider-autoplay");
    let autoPlayTimer = null;
    let isAdjustingLoop = false;
    const originalSlides = Array.from(track.querySelectorAll(".slider-slide"));
    const preferredCloneCount = track.classList.contains("room-slider") ? 3 : 2;
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

    const updateActiveMeta = () => {
      if (originalSlides.length === 0) {
        return;
      }

      const step = getStep();
      const adjustedIndex = Math.round(track.scrollLeft / step) - loopCloneCount;
      const normalizedIndex = ((adjustedIndex % originalSlides.length) + originalSlides.length) % originalSlides.length;
      const activeSlide = originalSlides[normalizedIndex];

      originalSlides.forEach((slide, index) => {
        slide.classList.toggle("is-active-slide", index === normalizedIndex);
      });

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

    const goNext = () => {
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
      prevButton.addEventListener("click", () => {
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
      nextButton.addEventListener("click", goNext);
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
        const nextImageSrc = activeTrigger.getAttribute("data-hospitality-image-src");
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

  arrivalStacks.forEach((stack) => {
    const cards = Array.from(stack.querySelectorAll("[data-arrival-card]"));
    const triggers = Array.from(stack.querySelectorAll("[data-arrival-trigger]"));

    const setActiveCard = (target) => {
      cards.forEach((card) => {
        const isActive = card.getAttribute("data-arrival-card") === target;
        card.classList.toggle("is-active", isActive);
      });

      triggers.forEach((trigger) => {
        trigger.setAttribute("aria-expanded", String(trigger.getAttribute("data-arrival-trigger") === target));
      });
    };

    cards.forEach((card) => {
      card.addEventListener("click", (event) => {
        const target = card.getAttribute("data-arrival-card");

        if (!target) {
          return;
        }

        setActiveCard(target);

        if (event.target.matches("[data-arrival-trigger]")) {
          event.target.focus();
        }
      });
    });
  });
});
