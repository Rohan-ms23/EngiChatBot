export const courseFaqs = [
    { q: "What is the passing grade for this course?", a: "The passing grade is **40%** overall, with a minimum of 35% required in the final semester exam." },
    { q: "How do I submit my mini-project?", a: "All projects must be compressed into a ZIP file and uploaded to the **Student Portal** before 11:59 PM on the due date." },
    { q: "What programming languages do we focus on?", a: "This course primarily focuses on **Java** and **Spring Boot** for backend development, and vanilla **JavaScript** for the frontend." },
    { q: "Will there be a viva/interview for the project?", a: "Yes. The final evaluation includes a 10-minute viva where you must explain your code architecture and API integration." }
];

export class FAQManager {
    constructor(modalId, listContainerId, closeBtnId) {
        this.modal = document.getElementById(modalId);
        this.listContainer = document.getElementById(listContainerId);
        this.closeBtn = document.getElementById(closeBtnId);
        this.init();
    }

    init() {
        this.listContainer.innerHTML = courseFaqs.map((faq, i) => `
            <div class="faq-item">
                <button class="faq-question" data-index="${i}">${faq.q} <i class="fa-solid fa-chevron-down"></i></button>
                <div class="faq-answer" id="faq-ans-${i}">${marked.parse(faq.a)}</div>
            </div>
        `).join('');

        this.listContainer.querySelectorAll('.faq-question').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.currentTarget.getAttribute('data-index');
                const ans = document.getElementById(`faq-ans-${index}`);
                const icon = e.currentTarget.querySelector('i');
                const isOpen = ans.classList.contains('open');
                
                document.querySelectorAll('.faq-answer').forEach(el => el.classList.remove('open'));
                document.querySelectorAll('.faq-question i').forEach(ic => ic.style.transform = 'rotate(0deg)');
                
                if (!isOpen) { ans.classList.add('open'); icon.style.transform = 'rotate(180deg)'; }
            });
        });

        this.closeBtn.addEventListener('click', () => this.modal.style.display = 'none');
    }

    open() { this.modal.style.display = 'flex'; }
}