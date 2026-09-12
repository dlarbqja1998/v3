import { beforeEach, describe, expect, it, vi } from 'vitest';
const environment = vi.hoisted(() => ({dev:true}));
vi.mock('$app/environment',()=>environment);
vi.mock('$env/dynamic/private',()=>({env:{}}));
import { load, actions } from './+page.server';

describe('축제 관리자 접근 제한',()=>{
	beforeEach(()=>{environment.dev=true;});
	it('비로그인 사용자의 조회와 저장을 로그인으로 보낸다',async()=>{
		const event={locals:{user:null}} as any;
		await expect(load(event)).rejects.toMatchObject({status:303,location:'/login?next=/admin/festival'});
		await expect(actions.default(event)).rejects.toMatchObject({status:303});
	});
	it('일반 사용자의 조회와 저장을 거부한다',async()=>{
		const event={locals:{user:{id:1,role:'user'}}} as any;
		await expect(load(event)).rejects.toMatchObject({status:403});
		await expect(actions.default(event)).rejects.toMatchObject({status:403});
	});
	it('운영에서도 관리자에게 편집을 허용하고 일반 사용자는 거부한다',async()=>{
		environment.dev=false;
		const event={locals:{user:{id:1,role:'admin'}}} as any;
		await expect(load(event)).resolves.toMatchObject({draft:{festival:{mapLabel:'POLARIS'}}});
		await expect(actions.default({locals:{user:{id:1,role:'user'}}} as any)).rejects.toMatchObject({status:403});
	});
	it('로컬 관리자에게 편집할 초기 구역을 제공한다',async()=>{
		const result=await load({locals:{user:{id:1,role:'admin'}}} as any);
		expect(result).toMatchObject({draft:{revision:0,festival:{name:'2026 동연제 : POLARIS',mapLabel:'POLARIS'}}});
	});
});
