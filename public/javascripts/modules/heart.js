import axios from 'axios';
import { $ } from './bling';

function ajaxHeart(e) {
    e.preventDefault();
    // console.log(this);
    axios
        .post(this.action)
        .then(res => {
            const isHearted = this.heart.classList.toggle('heart__button--hearted');
            $('.heart-count').textContent = res.data.hearts.length;
            if(isHearted) {
                this.heart.classList.add('heart__button--float');
                setTimeout(() => this.heartclassList.remove('heart__button--float'), 2500);
            }
        });

}

export default ajaxHeart;